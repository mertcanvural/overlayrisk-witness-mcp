# Publishing checklist

All code is built, tested, and pushed. The remaining steps need **interactive login**
(npm OTP, GitHub OAuth, web sign-in) — run them yourself. Order matters: npm first,
because the registry listings invoke `npx overlayrisk-witness-mcp`.

## 1. Publish to npm (keystone — do first)

The package name `overlayrisk-witness-mcp` is free. `npx`/Smithery/the registry all run it.

```bash
cd /Users/macbook/Projects/saas/flip/13-overlayrisk/mcp-public
npm login                 # interactive: username, password, email, OTP
npm publish --access public
npm view overlayrisk-witness-mcp version   # confirm it published
```

Smoke-test the published package from anywhere:

```bash
npx -y overlayrisk-witness-mcp    # should print "overlayrisk-witness MCP server running on stdio"
```

## 2. Official MCP Registry (registry.modelcontextprotocol.io)

`server.json` is already in the repo. The registry verifies you own the
`io.github.mertcanvural/*` namespace (GitHub OAuth) and that the npm package carries the
matching `mcpName` field (it does — added to `package.json`).

```bash
# install the publisher CLI (Go) — or grab a release binary from
# https://github.com/modelcontextprotocol/registry/releases
brew install mcp-publisher 2>/dev/null || go install github.com/modelcontextprotocol/registry/cmd/mcp-publisher@latest

mcp-publisher login github      # interactive device-code OAuth
mcp-publisher publish           # reads ./server.json
```

## 3. Smithery (smithery.ai)

`smithery.yaml` is in the repo. Smithery installs by running `npx -y overlayrisk-witness-mcp`.

1. Go to https://smithery.ai → **Sign in with GitHub**.
2. **Add Server** → point it at `github.com/mertcanvural/overlayrisk-witness-mcp`.
3. It reads `smithery.yaml`; confirm and publish.

## 4. Glama (glama.ai)

Glama auto-crawls public GitHub repos that contain an MCP server, so it may list the repo
on its own within a few days. To submit explicitly: https://glama.ai/mcp/servers → sign in
with GitHub → **Add server** → the repo URL.

## After listing

- Bump `version` in both `package.json` and `server.json` together for every release, then
  re-run `npm publish` and `mcp-publisher publish`.
- The MCP server is a **free distribution funnel** — it hands back one finding + a checkout
  link. Revenue still happens via Stripe on overlayrisk.com.
