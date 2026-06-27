#!/usr/bin/env node
// OverlayRiskWitness MCP server — thin client.
//
// This server contains NO scanning logic and NO secrets. Its single tool POSTs
// to the hosted OverlayRiskWitness API (https://overlayrisk.com/api/witness),
// which runs the real before/after overlay witness (accessiBe / UserWay) and
// returns one free documented finding. The full timestamped Risk Packet is a
// paid checkout on the website. This server is a free distribution funnel only.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const SERVER_NAME = 'overlayrisk-witness';
const SERVER_VERSION = '0.1.0';

const WITNESS_API_URL =
  process.env.OVERLAYRISK_API_URL ?? 'https://overlayrisk.com/api/witness';
const PRICING_URL = 'https://overlayrisk.com/pricing';
const REQUEST_TIMEOUT_MS = Number(process.env.OVERLAYRISK_TIMEOUT_MS ?? 200_000);

const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

server.registerTool(
  'witness_page',
  {
    title: 'Witness a public overlay page',
    description:
      'Runs the OverlayRiskWitness free one-page witness for a public URL. Loads the ' +
      'page with its accessibility overlay (accessiBe or UserWay) on, then off, captures ' +
      'both states, and returns one documented finding where the page’s public ' +
      'accessibility/compliance claims do not hold up, with a UTC timestamp. Findings are ' +
      'evidence, not a legal compliance ruling. The full timestamped Risk Packet is a paid ' +
      'checkout at ' + PRICING_URL + '.',
    inputSchema: {
      url: z
        .string()
        .min(1)
        .describe('HTTP or HTTPS public page URL to run through the free OverlayRiskWitness witness.'),
    },
    annotations: {
      title: 'Witness a public overlay page',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ url }, extra) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Forward client cancellation to the in-flight request.
    extra?.signal?.addEventListener('abort', () => controller.abort(), { once: true });

    // A witness run can take ~1-3 minutes, longer than many MCP clients' default
    // 60s request timeout. Emit periodic progress so clients that pass
    // resetTimeoutOnProgress keep the request alive without raising their timeout.
    const progressToken = extra?._meta?.progressToken;
    let progress = 0;
    const heartbeat =
      progressToken != null && extra?.sendNotification
        ? setInterval(() => {
            progress += 1;
            extra
              .sendNotification({
                method: 'notifications/progress',
                params: {
                  progressToken,
                  progress,
                  message: 'Running the before/after overlay witness…',
                },
              })
              .catch(() => {});
          }, 15_000)
        : null;

    try {
      const response = await fetch(WITNESS_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': `${SERVER_NAME}-mcp/${SERVER_VERSION}`,
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const code =
          body && typeof body.error === 'string' ? body.error : 'witness_failed';
        return toError({ status: response.status, code, error: code });
      }

      const lockedCount =
        body && typeof body.lockedFindingCount === 'number' ? body.lockedFindingCount : 0;
      const funnel =
        `\n\nThis is the free one-page witness: one documented finding is shown above` +
        (lockedCount > 0 ? `; ${lockedCount} more finding(s) are locked` : '') +
        `. Get the full timestamped Risk Packet ($49) at ${PRICING_URL}.`;

      return {
        content: [{ type: 'text', text: JSON.stringify(body, null, 2) + funnel }],
      };
    } catch (error) {
      const aborted = error && error.name === 'AbortError';
      return toError({
        status: 0,
        code: aborted ? 'witness_timeout' : 'network_error',
        error: aborted
          ? `The witness request timed out after ${REQUEST_TIMEOUT_MS}ms.`
          : String((error && error.message) || error),
      });
    } finally {
      clearTimeout(timer);
      if (heartbeat) clearInterval(heartbeat);
    }
  }
);

function toError(payload) {
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
  };
}

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`${SERVER_NAME} MCP server running on stdio`);
