# 🦾 CostcoHealth USA — Model Context Protocol (MCP) Server

Server MCP cung cấp "tay chân" (Tools) cho AI Agent trên GoClaw và Telegram để trực tiếp thao tác vào website bán hàng, quản lý đơn hàng và điều chỉnh giá sản phẩm.

---

## 🛠️ Danh Sách 3 MCP Tools

1. **`update_hero_title`**: Sửa tiêu đề và mô tả chính trên landing page `index.html`.
   - Params: `new_title` (bắt buộc), `new_subtitle` (tùy chọn)
2. **`get_today_orders`**: Báo cáo tổng số đơn và doanh thu bán hàng từ SePay & Google Sheets.
   - Params: `filter_date` ("today", "yesterday", "all")
3. **`update_product_price`**: Cập nhật giá sản phẩm trong catalog `script.js` và `crm_data.json`.
   - Params: `product_id` ("p1".."p6"), `new_price` (số tiền VNĐ)

---

## 🚀 Cấu Hình & Chạy Local

```bash
cd mcp
npm install
node server.js
```

Server sẽ lắng nghe tại `http://127.0.0.1:3001/mcp`.

---

## ⚙️ Mẫu Cấu Hình Systemd Service (`/etc/systemd/system/mcp-server.service`)

```ini
[Unit]
Description=CostcoHealth MCP Server for GoClaw AI Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/costcohealth/mcp
ExecStart=/usr/bin/node /var/www/costcohealth/mcp/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=MCP_PORT=3001
Environment=MCP_HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
```

Kích hoạt service:
```bash
systemctl daemon-reload
systemctl enable mcp-server
systemctl start mcp-server
systemctl status mcp-server
```

*(Hoặc dùng PM2: `pm2 start server.js --name "mcp-server"`)*

---

## 🧪 Lệnh Curl Test Cả 3 Function

### 1. Test Healthcheck:
```bash
curl http://127.0.0.1:3001/mcp
```

### 2. Test Initialize (MCP Protocol):
```bash
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

### 3. Test Danh Sách Tools (tools/list):
```bash
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

### 4. Test Gọi Tool `get_today_orders`:
```bash
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_today_orders","arguments":{"filter_date":"today"}}}'
```

### 5. Test Gọi Tool `update_product_price`:
```bash
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"update_product_price","arguments":{"product_id":"p1","new_price":595000}}}'
```

### 6. Test Gọi Tool `update_hero_title`:
```bash
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"update_hero_title","arguments":{"new_title":"Top Thực Phẩm Chức Năng Được Tin Dùng Nhất"}}}'
```
