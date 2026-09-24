/**
 * Vercel Serverless Function: Webhook tiếp nhận thanh toán từ SePay
 * Endpoint: POST /api/sepay-webhook
 * 
 * Khi có biến động số dư tiền vào tài khoản MB Bank (0946680292),
 * SePay sẽ tự động bắn POST webhook tới endpoint này.
 */

// Bộ nhớ tạm lưu trữ các giao dịch đã thanh toán thành công gần nhất
// (Trong kiến trúc serverless, có thể đồng bộ tiếp sang Google Sheets hoặc CRM)
const globalPaidOrders = global.paidOrders || new Map();
global.paidOrders = globalPaidOrders;

export default async function handler(req, res) {
  // Cho phép CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'CostcoHealth USA - SePay Webhook Listener',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body || {};
    console.log('Nhận webhook từ SePay:', JSON.stringify(payload));

    // SePay payload chuẩn:
    // { id, gateway, transactionDate, accountNumber, content, transferType, transferAmount, referenceCode }
    const content = (payload.content || payload.description || '').toUpperCase();
    const amount = parseInt(payload.transferAmount || payload.amount || 0);
    const transferType = (payload.transferType || 'in').toLowerCase();

    // Chỉ xử lý giao dịch tiền vào (tiền nhận được)
    if (transferType !== 'in' && amount <= 0) {
      return res.status(200).json({ success: true, message: 'Bỏ qua giao dịch không phải tiền vào' });
    }

    // Trích xuất mã đơn hàng DHxxxx từ nội dung chuyển khoản
    const match = content.match(/DH\d{3,6}/i);
    const orderCode = match ? match[0].toUpperCase() : null;

    if (orderCode) {
      // Đánh dấu đơn hàng đã thanh toán thành công
      globalPaidOrders.set(orderCode, {
        order_id: orderCode,
        amount: amount,
        paid_at: new Date().toISOString(),
        raw: payload
      });

      console.log(`✅ Xác nhận thanh toán thành công cho đơn [${orderCode}] với số tiền ${amount}đ`);

      // Đồng bộ trạng thái đã thanh toán sang Google Sheets CRM
      try {
        const GOOGLE_CLOUD_URL = process.env.GOOGLE_CLOUD_URL || 'https://script.google.com/macros/s/AKfycbxhYoywMBUvKXV7kM4l0h9pf_7TC-lIul1_6bt1aiC5mp7y6cdnEu3KcDLJpLDk5KvSCQ/exec';
        await fetch(GOOGLE_CLOUD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_status',
            id: orderCode,
            order_id: orderCode,
            status: 'success',
            paid_amount: amount,
            paid_at: new Date().toLocaleString('vi-VN')
          })
        }).catch(() => {});
      } catch (e) {}
    }

    // SePay yêu cầu phản hồi HTTP 200 kèm success: true trong 30 giây
    return res.status(200).json({
      success: true,
      message: 'Đã tiếp nhận và xử lý webhook SePay thành công',
      orderCode: orderCode,
      amount: amount
    });

  } catch (error) {
    console.error('Lỗi xử lý SePay webhook:', error);
    return res.status(200).json({ success: false, error: error.message });
  }
}
