# Bảng Đối Soát Số Liệu Thật (Day 12) - CostcoHealth USA

Dự án: **CostcoHealth USA** (`hangmyxachtay.info.vn`)  
Ngày đối soát: 21/09/2026  
Nguồn dữ liệu: `brain.db`, `crm_data.json`, `waitlist.json` & Bảng điều khiển `/admin`.

---

## 📊 Số Liệu Cốt Lõi

| Chỉ số | Con số chính xác | Chi tiết |
|---|:---:|---|
| **1. Khách hàng trong Waitlist / Customers** | **5 người** | Hoàng Nga, Trần Hùng, Mai Lan, Quốc Tuấn, Nguyễn Văn An *(+ các lượt test)* |
| **2. Tổng số đơn hàng trong bảng Orders** | **4 đơn** | DH1001, DH1002, DH1003, DH8685 *(chưa kể đơn test mới)* |
| **• Số đơn trạng thái 'SUCCESS' (Đã thanh toán)** | **2 đơn** | DH1002 (520.000đ) và DH1003 (0đ Ebook) |
| **• Số đơn trạng thái 'PENDING' (Chờ thanh toán)** | **2 đơn** | DH1001 (495.000đ) và DH8685 (2.000đ test) |
| **3. Tổng doanh thu thật đã nhận** | **520.000đ** *(hoặc 522.000đ gồm cả test Sepay)* | Tiền thật từ đơn thành công |
| **4. Số bài đã đăng trong 7 ngày qua** | **7 bài** | Chuỗi bài từ Ngày 5 đến Ngày 11 trên Facebook & Cộng đồng KP3 |

---

## 📋 Danh Sách Chi Tiết Đơn Hàng (`orders`)
1. **DH1001** — Hoàng Nga: 495.000đ (`pending`) — Kirkland Glucosamine 1500mg (375v)
2. **DH1002** — Trần Hùng: 520.000đ (`success`) — Kirkland Wild Alaskan Fish Oil (230v)
3. **DH1003** — Nguyễn Văn An: 0đ (`success`) — Ebook Cẩm Nang Phân Biệt TPCN Chuẩn Costco
4. **DH8685** — TEST KP3: 2.000đ (`pending` / `success`) — Test cổng VietQR Sepay MB Bank

---

## 👥 Danh Sách Khách Hàng Chờ (`customers`)
1. **Hoàng Nga** (0912345678) — `hoangnga.hn@gmail.com` — Quan tâm: Glucosamine
2. **Trần Hùng** (0987654321) — `tranhung.sg@gmail.com` — Quan tâm: Fish Oil
3. **Mai Lan** (0905123456) — `mailan.dn@gmail.com` — Quan tâm: Collagen
4. **Quốc Tuấn** (0934567890) — `quoctuan.hp@gmail.com` — Quan tâm: Move Free
5. **Nguyễn Văn An** (0945678901) — `nguyenvanan.ct@gmail.com` — Quan tâm: Ginkgo Biloba
