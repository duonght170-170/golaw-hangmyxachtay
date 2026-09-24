# GHI CHÚ DEPLOY WEBSITE LÊN VPS (DEPLOY NOTES)

Tài liệu hướng dẫn triển khai và vận hành hệ thống website **CostcoHealth USA** trên máy chủ VPS Ubuntu 24.04.

---

## 1. CÁC BIẾN MÔI TRƯỜNG (.env) CẦN CÓ TRÊN VPS
Tạo file `/var/www/costcohealth/.env` với các giá trị cấu hình thực tế:

```env
# Cổng lắng nghe máy chủ
PORT=3000

# Resend API Key (Gửi email xác nhận đơn và email sequence tự động)
RESEND_API_KEY=your_resend_api_key_here

# Cấu hình Domain & Email gửi đi
DOMAIN=hangmyxachtay.info.vn
SENDER_EMAIL=CostcoHealth USA <hi@hangmyxachtay.info.vn>

# Cổng thanh toán VietQR & SePay (MB Bank)
SEPAY_BANK_CODE=MB
SEPAY_ACC_NUMBER=0946680292
SEPAY_ACC_NAME=DUONG THUY DUONG

# Cloud Database Google Sheets (Apps Script Webhook Endpoint)
GOOGLE_CLOUD_URL=https://script.google.com/macros/s/AKfycbw6H3Z0H8m2sJ9R7U_6_06dKxQ_B-C7j4lTq8e7p7O_m5y2jQ/exec
```

---

## 2. CỔNG LẮNG NGHE & DỊCH VỤ TRÊN VPS

| Dịch vụ | Cổng nội bộ | Tiến trình quản lý | URL công khai qua Nginx |
| :--- | :--- | :--- | :--- |
| **Website & Backend API** | `3000` | PM2: `costco-api` | `https://hangmyxachtay.info.vn` |
| **MCP Server (Model Context Protocol)** | `3001` | PM2: `mcp-server` | `https://hangmyxachtay.info.vn/mcp` |
| **GoClaw Gateway & Dashboard** | `18790` | Docker: `goclaw-goclaw-1` | `https://goclaw.hangmyxachtay.info.vn` |

---

## 3. CÁC LỆNH VẬN HÀNH CHÍNH TRÊN VPS

### Khởi động / Khởi động lại dịch vụ qua PM2:
```bash
# Kiểm tra trạng thái các tiến trình
pm2 list

# Khởi động lại API server
pm2 restart costco-api

# Khởi động lại MCP server
pm2 restart mcp-server

# Xem log realtime
pm2 logs costco-api
pm2 logs mcp-server
```

### Kiểm tra Nginx & SSL:
```bash
# Test cấu hình Nginx
nginx -t

# Reload Nginx
systemctl reload nginx
```

### Thư mục chứa mã nguồn:
- Website: `/var/www/costcohealth`
- MCP Server: `/var/www/costcohealth/mcp`
- GoClaw config: `/var/lib/docker/volumes/goclaw_goclaw-workspace/_data`
