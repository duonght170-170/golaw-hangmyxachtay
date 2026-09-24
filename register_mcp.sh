#!/bin/bash
cat << 'EOF' > /tmp/mcp_reg.json
{
  "name": "my-business",
  "transport": "streamable-http",
  "url": "http://127.0.0.1:3001/mcp",
  "tool_prefix": "biz",
  "enabled": true
}
EOF

curl -i -X POST http://127.0.0.1:18790/v1/mcp/servers \
  -H "Authorization: Bearer 14bffc098471c910fa1a8d8610ee737a" \
  -H "Content-Type: application/json" \
  -d @/tmp/mcp_reg.json
