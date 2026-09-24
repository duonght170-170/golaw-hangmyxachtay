/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT CHO HỆ THỐNG CRM & BÁN HÀNG TỰ ĐỘNG - COSTCOHEALTH USA
 * Dùng làm Cloud Database dùng chung cho: thanh-toan.html, admin.html và index.html
 * Giúp đồng bộ đơn hàng tức thì giữa mọi trình duyệt (kể cả Ẩn danh & Thiết bị khác)
 * ==============================================================================
 * 
 * HƯỚNG DẪN 3 BƯỚC CÀI ĐẶT (MẤT 1 PHÚT):
 * 1. Mở trình duyệt vào link: https://sheets.new (Tạo 1 Google Sheet mới, đặt tên "CostcoHealth CRM")
 * 2. Trên thanh menu, bấm: Tiện ích mở rộng (Extensions) -> Apps Script
 * 3. Xóa hết mã cũ trong đó, dán toàn bộ đoạn code bên dưới vào và bấm biểu tượng Lưu (Save).
 * 4. Bấm nút: Triển khai (Deploy) -> Tùy chọn triển khai mới (New deployment)
 *    - Chọn loại: Ứng dụng web (Web app)
 *    - Thực thi dưới dạng (Execute as): Tôi (Me)
 *    - Người có quyền truy cập (Who has access): Bất kỳ ai (Anyone)  <-- BẮT BUỘC CHỌN "ANYONE"
 *    - Bấm Triển khai (Deploy) -> Cấp quyền truy cập (Authorize access) -> Chọn tài khoản Google của bạn -> Bấm Advanced -> Go to ... (unsafe) -> Allow.
 * 5. Sao chép "URL của ứng dụng web" (dạng: https://script.google.com/macros/s/.../exec) và dán vào ô Cloud Database URL trên trang /admin.
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Orders") || ss.getActiveSheet();
    
    // Nếu sheet chưa có dữ liệu, khởi tạo tiêu đề và đơn mẫu
    if (sheet.getLastRow() <= 1) {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["id", "customer_name", "customer_phone", "product_name", "product_type", "amount", "status", "created_at"]);
      }
      sheet.appendRow(["DH8685", "TEST KP3", "0946680292", "Kirkland Glucosamine 1500mg with MSM (375v)", "physical", 2000, "pending", "2026-09-18 17:30:00"]);
    }
    
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var orders = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var order = {};
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j].toString().trim();
        order[key] = row[j];
      }
      if (order.id || order.customer_name) {
        orders.push(order);
      }
    }

    // Nếu có tham số orderCode, đối soát và trả về kết quả nhanh cho mã đó
    var queryCode = e && e.parameter ? (e.parameter.orderCode || e.parameter.id || "").toUpperCase().trim() : "";
    if (queryCode) {
      var reversed = orders.slice().reverse();
      var matched = reversed.find(function(o) {
        return (o.id && o.id.toString().toUpperCase().trim() === queryCode) || 
               (o.order_id && o.order_id.toString().toUpperCase().trim() === queryCode);
      });
      if (matched) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          found: true,
          orderCode: queryCode,
          paid: matched.status === "success",
          orderStatus: matched.status,
          amount: matched.amount
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          found: false,
          orderCode: queryCode,
          paid: false
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      total: orders.length,
      orders: orders
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Orders") || ss.getActiveSheet();
    
    // Khởi tạo hàng tiêu đề nếu sheet trống
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["id", "customer_name", "customer_phone", "product_name", "product_type", "amount", "status", "created_at"]);
    }
    
    var payload = {};
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (ex) {
        payload = e.parameter || {};
      }
    } else if (e.parameter) {
      payload = e.parameter;
    }
    
    // Xử lý payload nếu bắn từ Webhook SePay trực tiếp
    var sepayContent = (payload.content || payload.description || "").toUpperCase();
    var sepayMatch = sepayContent.match(/DH\d{3,6}/i);
    var sepayOrderCode = sepayMatch ? sepayMatch[0].toUpperCase() : null;

    var orderId = payload.id || payload.order_id || sepayOrderCode || ("DH" + Math.floor(1000 + Math.random() * 9000));
    var isSepayHook = !!(payload.gateway || payload.transferAmount || sepayOrderCode);

    var data = sheet.getDataRange().getValues();
    var idColIdx = 0;
    var statusColIdx = 6;
    var targetRowIdx = -1;

    for (var i = 1; i < data.length; i++) {
      var rowId = (data[i][idColIdx] || "").toString().toUpperCase().trim();
      if (rowId === orderId.toString().toUpperCase().trim()) {
        targetRowIdx = i + 1; // 1-indexed trong Google Sheet
      }
    }

    // Nếu là lệnh cập nhật trạng thái hoặc từ Webhook SePay đã có đơn trong bảng
    if (payload.action === 'update_status' || payload.action === 'update_payment' || isSepayHook || (payload.status === 'success' && targetRowIdx > 0)) {
      var newStatus = payload.status || 'success';
      if (targetRowIdx > 0) {
        sheet.getRange(targetRowIdx, statusColIdx + 1).setValue(newStatus);
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          action: "updated",
          order_id: orderId,
          order_status: newStatus,
          message: "Đã cập nhật trạng thái đơn hàng thành công!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    var customerName = payload.customer_name || payload["Họ và tên"] || (isSepayHook ? "Khách SePay MB" : "Khách Vãng Lai");
    var customerPhone = payload.customer_phone || payload["Số điện thoại"] || "";
    var productName = payload.product_name || payload["Danh sách sản phẩm"] || "Sản phẩm Costco";
    var productType = payload.product_type || "physical";
    var amount = parseInt(payload.transferAmount || payload.amount) || 0;
    var status = isSepayHook ? "success" : (payload.status || "pending");
    var createdAt = payload.created_at || new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    
    // Ghi hàng mới vào Google Sheet
    sheet.appendRow([
      orderId,
      customerName,
      customerPhone,
      productName,
      productType,
      amount,
      status,
      createdAt
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: "created",
      order_id: orderId,
      order_status: status,
      message: "Đơn hàng đã được lưu tự động vào Google Sheets!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
