# 🇺🇸 CostcoHealth USA - Hệ Thống Bán Hàng Tự Động & Chăm Sóc Khách Hàng

> **Website:** [https://hangmyxachtay.info.vn](https://hangmyxachtay.info.vn)  
> **Cổng thanh toán VietQR:** [https://hangmyxachtay.info.vn/thanh-toan.html](https://hangmyxachtay.info.vn/thanh-toan.html)  
> **Bảng quản trị CRM:** [https://hangmyxachtay.info.vn/admin.html](https://hangmyxachtay.info.vn/admin.html)

---

## 📖 1. Giới Thiệu Dự Án
CostcoHealth USA là hệ thống bán lẻ thực phẩm chức năng chuẩn Costco Wholesale Mỹ, vận chuyển 100% bay Air kèm hóa đơn giấy gốc. Hệ thống được tự động hóa từ đầu phễu đến vận hành hậu cần:
1. **Landing Page:** Thiết kế chuẩn phong cách Costco Mỹ, tối ưu chuyển đổi, danh mục sản phẩm minh bạch.
2. **AI Sales Chatbot 24/7:** Tư vấn khách hàng, giải đáp thắc mắc và kịch bản xử lý từ chối theo chuẩn dược sĩ.
3. **VietQR Sepay Auto Checkout:** Tự động sinh mã VietQR theo chuẩn NAPAS, đồng bộ dòng tiền tức thì vào MB Bank.
4. **Email Automation (Resend API):** Chuỗi email chăm sóc khách hàng tự động, xác nhận đơn hàng, đạt chuẩn bảo mật SPF, DKIM, DMARC quốc tế.
5. **Admin CRM Dashboard:** Quản lý sản phẩm, đơn hàng, khách hàng và tự động trừ kho vật lý.

---

## 📂 2. Cấu Trúc Thư Mục
```
costco-landing-page/
├── index.html              # Landing page chính bán hàng
├── thanh-toan.html         # Cổng thanh toán tự động VietQR Sepay
├── admin.html              # Trang quản trị CRM & Kho hàng
├── cam-nang-costco.html    # Ebook cẩm nang (Sản phẩm số 0đ)
├── script.js               # Logic giỏ hàng, form khảo sát, AI Chatbot
├── styles.css              # Giao diện responsive chuẩn Costco
├── vercel.json             # Cấu hình Clean URLs & Serverless Functions
├── api/                    # Vercel Serverless Functions
│   ├── send-email.js       # API gửi email đơn lẻ (xác nhận đơn hàng)
│   └── send-sequence.js    # API gửi chuỗi email tự động (Welcome, Nurture)
├── .env.example            # Mẫu biến môi trường bảo mật
├── .gitignore              # Danh sách loại trừ các file nhạy cảm
├── deploy_vercel.bat       # Script 1-click deploy lên Vercel
├── brain.db                # Database SQLite Bộ Não Thứ 2 (Knowledge & CRM)
└── backup/                 # Thư mục sao lưu database dự phòng
```

---

## ⚙️ 3. Cài Đặt & Cấu Hình Môi Trường (.env)

Tạo file `.env` tại thư mục gốc của dự án:
```env
# Resend API Key (Email Service)
RESEND_API_KEY=re_your_api_key_here

# Domain & Sender Email
DOMAIN=hangmyxachtay.info.vn
SENDER_EMAIL=CostcoHealth USA <hi@hangmyxachtay.info.vn>

# Cấu hình VietQR Sepay MB Bank
SEPAY_BANK_CODE=MB
SEPAY_ACC_NUMBER=0946680292
SEPAY_ACC_NAME=HOANG THUY DUONG
```

---

## 🚀 4. Hướng Dẫn Deploy Lên Vercel (Production)

### Cách 1: Sử dụng file script 1-Click (Khuyến nghị cho Windows)
Chỉ cần nhấp đúp chuột vào file:
```bash
deploy_vercel.bat
```

### Cách 2: Deploy thủ công qua Terminal
```bash
# 1. Cài đặt Vercel CLI (nếu chưa có)
npm install -g vercel

# 2. Deploy thẳng lên môi trường Production
vercel --prod --yes
```

---

## 🌐 5. Cấu Hình DNS Tên Miền (hangmyxachtay.info.vn)

Để website hoạt động và email không bị Gmail lọc vào thư rác (Spam), cấu hình đủ 6 bản ghi trên hệ thống DNS:

| Loại | Tên bản ghi | Giá trị | Mục đích |
|---|---|---|---|
| **A** | `@` (hoặc domain chính) | `76.76.21.21` | Trỏ website về máy chủ Vercel |
| **CNAME** | `rsend` | `rsend-apne1.forge.rmta.net` | Cấu hình Mail Server Resend Tokyo |
| **CNAME** | `send` | `send.forge.rmta.net` | Cấu hình Return-Path (SPF) |
| **TXT** | `resend._domainkey` | `p=MIGfMA...` *(khóa DKIM)* | Ký khóa số bảo mật DKIM 2048-bit |
| **TXT** | `_dmarc` | `v=DMARC1; p=none;` | Tiêu chuẩn chống giả mạo DMARC |
| **TXT** | `@` | `v=spf1 include:_spf.resend.com ~all` | Khai báo máy chủ gửi mail SPF |

---

## 🛡️ 6. Bảo Mật & Sao Lưu (Security & Backup)
* **Bảo vệ API Key:** Toàn bộ khóa bí mật được quản lý qua biến môi trường (`.env`), không commit lên repository công khai.
* **Form Validation:** Kiểm tra định dạng Email chuẩn quốc tế (RFC) và Số điện thoại di động Việt Nam (10 số) trước khi gửi.
* **Database Backup:** File `brain.db` được định kỳ sao lưu trong thư mục `backup/`.
