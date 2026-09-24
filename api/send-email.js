/**
 * Vercel Serverless Function: Gửi Email tự động qua Resend API
 * Hỗ trợ CORS cho domain hangmyxachtay.info.vn và vercel.app
 */

export default async function handler(req, res) {
  // Cấu hình CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { to, subject, html, text, from } = req.body || {};

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ error: 'Thiếu thông tin: to, subject, hoặc html/text.' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return res.status(500).json({ success: false, error: 'Chưa cấu hình RESEND_API_KEY trong file .env' });
    }
    const FROM_EMAIL = from || process.env.SENDER_EMAIL || 'CostcoHealth USA <hi@hangmyxachtay.info.vn>';

    const payload = {
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html || `<p>${text}</p>`
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Lỗi từ Resend API:', result);
      return res.status(response.status).json({ success: false, error: result });
    }

    return res.status(200).json({
      success: true,
      message: 'Gửi email thành công qua Resend!',
      id: result.id,
      from: FROM_EMAIL,
      to: payload.to
    });
  } catch (error) {
    console.error('Lỗi server gửi mail:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
