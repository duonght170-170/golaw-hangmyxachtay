# 🦾 MCP FUNCTIONS CHÍNH THỨC — COSTCOHEALTH USA
*Hệ thống 3 công cụ (Tools) được chọn để build MCP Server kết nối GoClaw & Telegram*

---

## 1. `update_hero_title` (Sửa tiêu đề Landing Page tức thì)
* **Tên function:** `update_hero_title`
* **Input params:**
  * `new_title` (string, required): Tiêu đề chính mới muốn hiển thị trên landing page.
  * `new_subtitle` (string, optional): Đoạn mô tả phụ bên dưới tiêu đề (nếu bỏ qua sẽ giữ nguyên subtitle cũ).
* **Output dự kiến:**
  ```json
  {
    "success": true,
    "message": "Đã cập nhật tiêu đề landing page trên VPS thành công!",
    "old_title": "Top Thực Phẩm Chức Năng Được Tin Dùng Nhất",
    "new_title": "⚡ Flash Sale Cuối Tuần: Giảm 30% Toàn Bộ TPCN Bay Air",
    "updated_at": "2026-09-23T23:50:00Z"
  }
  ```
* **Tình huống dùng hàng ngày:** Đang ngồi cà phê nảy ra ý tưởng khuyến mãi hoặc đổi hook giữ chân khách, chỉ cần nhắn 1 câu qua Telegram là file `index.html` trên VPS được cập nhật ngay, khách truy cập refresh là thấy.
* **📱 Ví dụ câu nhắn Telegram sẽ trigger function này:**
  * *"Đổi tiêu đề landing thành '⚡ Flash Sale Cuối Tuần: Giảm 30% Toàn Bộ TPCN Bay Air'"*
  * *"Sửa tiêu đề web thành 'Mừng Đại Lễ: Miễn Phí Vận Chuyển Hỏa Tốc Bay Air' giúp tôi"*
  * *"Cập nhật tiêu đề trang chủ: 'Khuyến Mãi Đặc Biệt Tháng Này' và mô tả 'Tặng kèm cẩm nang phân biệt TPCN thật giả'"*

---

## 2. `get_today_orders` (Báo cáo đơn hàng & Doanh thu)
* **Tên function:** `get_today_orders`
* **Input params:**
  * `filter_date` (string, optional): "today" (mặc định hôm nay), "yesterday" (hôm qua), hoặc "all" (toàn bộ).
* **Output dự kiến:**
  ```json
  {
    "success": true,
    "filter": "today",
    "date": "2026-09-23",
    "total_orders": 3,
    "paid_orders": 2,
    "pending_orders": 1,
    "total_revenue_vnd": 1215000,
    "orders": [
      {
        "id": "DH8685",
        "customer": "Hoàng Thùy Dương",
        "phone": "0946680292",
        "total": 2000,
        "status": "success",
        "paid_at": "2026-09-23 21:30:15"
      },
      {
        "id": "DH4912",
        "customer": "Nguyễn Văn A",
        "phone": "0912345678",
        "total": 595000,
        "status": "success",
        "paid_at": "2026-09-23 18:15:00"
      }
    ]
  }
  ```
* **Tình huống dùng hàng ngày:** Đang đi ngoài đường, mở Telegram hỏi doanh số ngày hôm nay để nắm tình hình kinh doanh mà không cần mở laptop đăng nhập trang quản trị.
* **📱 Ví dụ câu nhắn Telegram sẽ trigger function này:**
  * *"Hôm nay có bao nhiêu đơn rồi, thu được bao nhiêu tiền?"*
  * *"Báo cáo doanh thu hôm nay"*
  * *"Xem tình hình đơn hàng hôm qua thế nào"*

---

## 3. `update_product_price` (Điều chỉnh giá bán sản phẩm trên Web)
* **Tên function:** `update_product_price`
* **Input params:**
  * `product_id` (string, required): Mã định danh sản phẩm:
    * `p1`: Kirkland Glucosamine 1500mg (375v)
    * `p2`: Kirkland Wild Alaskan Fish Oil (230v)
    * `p3`: Youtheory Collagen Advanced (390v)
    * `p4`: Schiff Move Free Ultra (75v)
    * `p5`: Natrol Biotin 10,000 mcg (60v)
    * `p6`: Trunature Ginkgo Biloba 120mg (300v)
  * `new_price` (number, required): Giá bán mới tính bằng VNĐ (ví dụ: `550000`).
* **Output dự kiến:**
  ```json
  {
    "success": true,
    "message": "Đã cập nhật giá sản phẩm thành công trên website!",
    "product_id": "p1",
    "product_name": "Kirkland Glucosamine 1500mg (375v)",
    "old_price": 595000,
    "new_price": 550000,
    "updated_at": "2026-09-23T23:50:00Z"
  }
  ```
* **Tình huống dùng hàng ngày:** Khi siêu thị Costco Mỹ giảm giá chớp nhoáng hoặc bạn muốn chạy khuyến mãi cho 1 dòng sản phẩm cụ thể, chỉ cần nhắn tin để điều chỉnh giá bán ngay lập tức trên website và giỏ hàng.
* **📱 Ví dụ câu nhắn Telegram sẽ trigger function này:**
  * *"Sửa giá Glucosamine xuống 550k"*
  * *"Giảm giá Dầu cá Fish Oil thành 580000"*
  * *"Đổi giá Collagen Youtheory p3 thành 600k"*
