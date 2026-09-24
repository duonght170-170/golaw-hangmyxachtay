/**
 * Vercel Serverless Function: Kiểm tra trạng thái thanh toán đơn hàng
 * Endpoint: GET /api/check-payment?orderCode=DHxxxx
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const orderCode = (req.query.orderCode || '').toUpperCase().trim();

  if (!orderCode) {
    return res.status(400).json({ error: 'Thiếu orderCode' });
  }

  const globalPaidOrders = global.paidOrders || new Map();
  const paidInfo = globalPaidOrders.get(orderCode);

  if (paidInfo) {
    return res.status(200).json({
      paid: true,
      status: 'success',
      orderCode: orderCode,
      amount: paidInfo.amount,
      paid_at: paidInfo.paid_at
    });
  }

  // Nếu trong bộ nhớ chưa có, thử query kiểm tra từ Google Sheets Cloud DB
  try {
    const GOOGLE_CLOUD_URL = process.env.GOOGLE_CLOUD_URL || 'https://script.google.com/macros/s/AKfycbxhYoywMBUvKXV7kM4l0h9pf_7TC-lIul1_6bt1aiC5mp7y6cdnEu3KcDLJpLDk5KvSCQ/exec';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const cloudRes = await fetch(`${GOOGLE_CLOUD_URL}?orderCode=${encodeURIComponent(orderCode)}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (cloudRes.ok) {
      const data = await cloudRes.json();
      if (data && data.paid === true) {
        return res.status(200).json({
          paid: true,
          status: 'success',
          orderCode: orderCode,
          amount: data.amount
        });
      }
      if (data && data.orders) {
        // Duyệt từ bản ghi mới nhất xuống để bắt trạng thái cập nhật mới nhất
        const reversed = [...data.orders].reverse();
        const matched = reversed.find(o => 
          (o.id === orderCode || o.order_id === orderCode)
        );
        if (matched && matched.status === 'success') {
          return res.status(200).json({
            paid: true,
            status: 'success',
            orderCode: orderCode,
            amount: matched.amount
          });
        }
      }
    }
  } catch (e) {}

  // 3. Kiểm tra trực tiếp qua SePay API nếu có SEPAY_API_KEY
  const sepayApiKey = process.env.SEPAY_API_KEY;
  if (sepayApiKey) {
    try {
      const sepayRes = await fetch('https://my.sepay.vn/userapi/transactions/list', {
        headers: {
          'Authorization': `Apikey ${sepayApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (sepayRes.ok) {
        const sepayData = await sepayRes.json();
        if (sepayData && sepayData.transactions && Array.isArray(sepayData.transactions)) {
          const matchedTx = sepayData.transactions.find(t => {
            const content = (t.transaction_content || '').toUpperCase();
            return content.includes(orderCode) && parseFloat(t.amount_in || 0) > 0;
          });
          if (matchedTx) {
            const amt = parseInt(matchedTx.amount_in) || 0;
            // Cập nhật Cloud DB
            try {
              const GOOGLE_CLOUD_URL = process.env.GOOGLE_CLOUD_URL || 'https://script.google.com/macros/s/AKfycbxhYoywMBUvKXV7kM4l0h9pf_7TC-lIul1_6bt1aiC5mp7y6cdnEu3KcDLJpLDk5KvSCQ/exec';
              fetch(GOOGLE_CLOUD_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'update_status',
                  id: orderCode,
                  order_id: orderCode,
                  status: 'success',
                  paid_amount: amt,
                  paid_at: matchedTx.transaction_date || new Date().toISOString()
                })
              }).catch(() => {});
            } catch (e) {}

            return res.status(200).json({
              paid: true,
              status: 'success',
              orderCode: orderCode,
              amount: amt,
              paid_at: matchedTx.transaction_date
            });
          }
        }
      }
    } catch (e) {}
  }

  return res.status(200).json({
    paid: false,
    status: 'pending',
    orderCode: orderCode
  });
}
