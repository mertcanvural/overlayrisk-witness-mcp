# OverlayRiskWitness MCP server

A [Model Context Protocol](https://modelcontextprotocol.io) server that runs the
**free, independent before/after accessibility-overlay witness** from
[OverlayRiskWitness](https://overlayrisk.com) on any public URL.

Accessibility overlay widgets (accessiBe, UserWay, and similar) are sold as one-line
ADA/WCAG compliance fixes, but independent testing routinely shows the underlying page is
unchanged for real assistive-technology users. This server lets an AI agent run the
witness: it loads a page with the overlay **on**, then **off**, captures both states, and
returns one documented finding where the page's public accessibility/compliance claims
don't hold up — with a UTC timestamp.

> Findings are **evidence, not a legal compliance ruling.** This server is independent of
> accessiBe and UserWay; it tests their effect, it does not sell or defend an overlay.

## What this server is (and isn't)

This is a **thin client**. It contains no scanning logic and **no secrets**. Its single
tool POSTs to the hosted API at `https://overlayrisk.com/api/witness`, which does the real
work (overlay detection, headless before/after capture, claim extraction). The full
timestamped **Risk Packet** is a paid checkout on the website — see
[overlayrisk.com/pricing](https://overlayrisk.com/pricing). The MCP server is a free
funnel; it never handles payment.

## Tool

### `witness_page`

| | |
|---|---|
| Input | `{ "url": "https://example.com/checkout" }` — a public HTTP/HTTPS page URL |
| Success | The free-witness JSON: `runId`, `siteUrl`, `overlayVendor` (`accessibe`/`userway`), `pagesTested`, `claimsTested`, `didNotHoldUp`, `freeFinding`, `lockedFindingCount` — plus a note linking to the paid Risk Packet |
| Error | `{ status, code, error }` (e.g. `overlay_no_effect`, `page_fetch_failed`, `witness_timeout`) |

A single witness run can take up to ~3 minutes on cold/heavy sites. That exceeds many
MCP clients' default 60s request timeout. The server emits periodic progress
notifications, so clients that honor `resetTimeoutOnProgress` stay connected
automatically; clients that don't should raise their per-request timeout.

## Install

Run directly with `npx` (no global install):

```bash
npx overlayrisk-witness-mcp
```

The process speaks MCP over stdio.

### Claude Desktop / Cursor / other MCP clients

Add to your client's MCP config:

```json
{
  "mcpServers": {
    "overlayrisk-witness": {
      "command": "npx",
      "args": ["-y", "overlayrisk-witness-mcp"]
    }
  }
}
```

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `OVERLAYRISK_API_URL` | `https://overlayrisk.com/api/witness` | Override the witness endpoint (e.g. for local dev) |
| `OVERLAYRISK_TIMEOUT_MS` | `200000` | Request timeout in ms |

No API key is required — the free one-page witness is public.

## Develop

```bash
npm install
npm run smoke   # offline handshake test (lists tools, no network)
npm start       # run the server on stdio
```

## License

MIT © Mert Can Vural
