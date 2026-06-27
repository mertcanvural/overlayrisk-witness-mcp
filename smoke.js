// Offline smoke test: boot the server over stdio and confirm it advertises the
// witness_page tool. Does NOT call the tool, so it makes no network request.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({ command: 'node', args: ['index.js'] });
const client = new Client({ name: 'overlayrisk-mcp-smoke', version: '0.0.0' });

await client.connect(transport);
const { tools } = await client.listTools();
const names = tools.map((t) => t.name);

await client.close();

if (!names.includes('witness_page')) {
  console.error('FAIL: witness_page not advertised. Got:', names);
  process.exit(1);
}

console.log('OK: tools =', names.join(', '));
process.exit(0);
