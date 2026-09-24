# Nhật Ký Kiểm Thử Hệ Thống (End-to-End Test Log) - Day 12

Dự án: **CostcoHealth USA** (`hangmyxachtay.info.vn`)  
Ngày kiểm thử: 21/09/2026  
Mục tiêu: Đóng vai khách hàng đi trọn vẹn luồng từ Đầu phễu (Waitlist) -> Chăm sóc (Email / Chatbot) -> Mua hàng & Thanh toán tự động (VietQR Sepay) -> Quản trị (Admin CRM & Kho hàng).

---

## 📋 Danh Sách Kịch Bản Kiểm Thử (Checklist)

| STT | Luồng kiểm thử | Trạng thái | Ghi chú / Lỗi phát sinh | Cách xử lý |
|---|---|---|---|---|
| 1 | Điền Form Waitlist / Khảo sát (`+test`) | Chưa test | | |
| 2 | Nhận Email Chào mừng (Email Sequence Resend) | Chưa test | | |
| 3 | Chatbot AI Tư vấn 3 câu (Hỏi giá, tư vấn bệnh, xử lý từ chối) | Chưa test | | |
| 4 | Đặt hàng & Quét mã VietQR Sepay (2.000đ thật) | Chưa test | | |
| 5 | Nhận Email Xác nhận đơn hàng tự động | Chưa test | | |
| 6 | Kiểm tra Dashboard `/admin` (Đơn lên SUCCESS + Trừ kho) | Chưa test | | |

---

## 🐛 Chi Tiết Bug & Fix Log

### Bug 1: Thư chào mừng bị đẩy sang "Tất cả thư", hộp thư chính lại hiện thư ngày 2 & ngày 3
* **Nguyên nhân:** 
  1. Ở chế độ test, hệ thống gửi liên tiếp cả 3 email trong vòng 3 giây nên Thư 2 và Thư 3 xuất hiện đè lên trên cùng của hộp thư chính.
  2. Tiêu đề Thư 1 chứa từ khóa *"món quà / voucher"* kích hoạt bộ lọc quảng cáo của Gmail đẩy thư ra khỏi tab Chính (Primary).
* **Cách fix:** 
  1. Tách chế độ: Khi điền form chờ / test thông thường, hệ thống **chỉ gửi duy nhất Email 1 (Chào mừng)**. Thư ngày 2 và ngày 3 không bị gửi dồn dập nữa.
  2. Đổi tiêu đề Email 1 thành thân tình: `Chào {Tên}, lời chào từ Dương (CostcoHealth USA 🇺🇸)` để Gmail tự động phân loại thẳng vào **Hộp thư chính (Primary)**.

### Bug 2: Chưa nhận được email xác nhận đơn hàng tự động sau khi đặt hàng / thanh toán
* **Nguyên nhân:** 
  1. Trường Email trên trang `thanh-toan.html` trước đó không có thuộc tính `required` bắt buộc, nếu người dùng không gõ lại email thì hệ thống không có địa chỉ nhận.
  2. Trang thanh toán chưa tự động đồng bộ (auto-fill) lại email khách đã điền từ trang chủ.
* **Cách fix:** 
  1. Đặt trường Email thành bắt buộc (`required`) trên trang thanh toán.
  2. Thêm logic tự động điền sẵn Họ tên, SĐT và Email từ phiên đăng ký trước đó.
  3. Kích hoạt trigger tự động gửi email biên lai đơn hàng qua Resend API ngay khi tạo mã QR và khi thanh toán thành công.

### Bug 3: Đơn hàng chưa kịp chuyển khoản đã tự động chuyển trạng thái SUCCESS (Nguy cơ gửi hàng khi chưa nhận tiền)
* **Nguyên nhân:**
  1. Trang `thanh-toan.html` cũ có cài đặt bộ hẹn giờ `autoSuccessTimer` (8-10 giây) giả lập tự nhảy sang màn hình "Thanh toán thành công" và cập nhật CRM sang `success`.
  2. Trang có nút bấm cho phép khách tự xác nhận mà không qua kiểm tra ngân hàng.
  3. Các serverless API kiểm tra đối soát thật chưa được deploy lên môi trường Vercel production.
* **Cách fix:**
  1. Xóa bỏ 100% mọi timer giả lập (`autoSuccessTimer`) và nút tự xác nhận của khách.
  2. Hệ thống chuyển sang cơ chế kiểm tra tiền thật qua `/api/check-payment`, webhook SePay MB Bank và Google Sheets Cloud DB. Chỉ chuyển màn hình thành công khi ngân hàng MB Bank thực sự nhận được tiền.
  3. Bổ sung nút "Kiểm tra kết quả chuyển khoản ngay" (đối soát thật) và nút chat Zalo trực tiếp hỗ trợ khách.
  4. Phân định rõ ràng trong `/admin`: Đơn hàng nào **ĐÃ NHẬN TIỀN** mới được đóng gói gửi đi, đơn hàng **CHỜ NHẬN TIỀN** cảnh báo rõ "CHƯA GỬI HÀNG".

