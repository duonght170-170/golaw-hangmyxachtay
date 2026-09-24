const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SENDER = process.env.SENDER_EMAIL || 'CostcoHealth USA <hi@hangmyxachtay.info.vn>';
const RECIPIENT = 'masiehoang17+test@gmail.com';

async function sendEmail(subject, html, index) {
  console.log(`Sending Email ${index}: "${subject}"...`);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: SENDER,
        to: [RECIPIENT],
        subject: subject,
        html: html
      })
    });
    const data = await res.json();
    console.log(`Email ${index} status:`, res.status, data);
    return data;
  } catch (err) {
    console.error(`Email ${index} error:`, err);
  }
}

async function run() {
  console.log('Testing Resend sequence...');
  await sendEmail('Email 1: Chào mừng bạn đến với CostcoHealth USA 🇺🇸', '<p>Nội dung Email 1 chào mừng</p>', 1);
  await new Promise(r => setTimeout(r, 2000));
  await sendEmail('Email 2: Thật ra, đừng vội mua Glucosamine nếu chưa biết điều này...', '<p>Nội dung Email 2 nurture</p>', 2);
  await new Promise(r => setTimeout(r, 2000));
  await sendEmail('Email 3: Chuyến bay Air tuần này chuẩn bị hạ cánh ✈️', '<p>Nội dung Email 3 chốt ưu đãi</p>', 3);
  console.log('Done!');
}

run();
