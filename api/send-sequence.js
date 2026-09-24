/**
 * Vercel Serverless Function: Gửi Chuỗi Email Tự Động (Email Sequence) qua Resend
 * Hỗ trợ chế độ TEST (+test): Gửi toàn bộ 3 email ngay lập tức!
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { name, email, phone, category, testMode } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Thiếu địa chỉ email khách hàng.' });
    }

    const custName = name || 'bạn';
    const isTest = testMode || email.includes('+test');
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return res.status(500).json({ success: false, error: 'Chưa cấu hình RESEND_API_KEY trong file .env' });
    }
    const SENDER = process.env.SENDER_EMAIL || 'CostcoHealth USA <hi@hangmyxachtay.info.vn>';

    // ==========================================
    // EMAIL TEMPLATES (Brand Voice CostcoHealth)
    // ==========================================

    // EMAIL 1: Chào Mừng (Được tối ưu tiêu đề thân tình để vào thẳng Hộp thư chính - Primary)
    const email1 = {
      subject: `Chào ${custName}, lời chào từ Dương (CostcoHealth USA 🇺🇸)`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
          <div style="background: #0f2b48; padding: 24px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">CostcoHealth<span style="color: #dc2626;">USA</span></h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Thực phẩm chức năng chuẩn Costco Mỹ 100% Bay Air</p>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-top: 0;">Chào <strong>${custName}</strong>,</p>
            <p>Cảm ơn bạn đã ghé thăm CostcoHealth USA và để lại thông tin.</p>
            <p>Mình là Dương. Thật ra, khi bắt đầu làm về hàng Mỹ xách tay, điều mình sợ nhất không phải là không bán được hàng, mà là sợ khách hàng lo lắng khi mua phải hàng giả trôi nổi trên mạng. Đồ uống vào cơ thể để bồi bổ cho bố mẹ hay bản thân thì phải rõ ràng từng đồng, từng cọng.</p>
            <p>Đó là lý do mình chọn cách làm cực nhất nhưng an tâm nhất: người nhà bên Cali tự đẩy xe vào siêu thị Costco nhặt từng lọ, giữ lại hóa đơn giấy in rõ ngày giờ mua tại quầy, và gửi hỏa tốc bằng máy bay (bay Air) giữ lạnh về Việt Nam.</p>
            
            <div style="background: #fefce8; border: 1.5px dashed #f59e0b; border-radius: 12px; padding: 18px 20px; margin: 24px 0; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #b45309; text-transform: uppercase;">MÃ ƯU ĐÃI DÀNH CHO BẠN:</div>
              <div style="font-size: 26px; font-weight: 900; color: #dc2626; margin: 6px 0; letter-spacing: 2px;">COSTCO100K</div>
              <div style="font-size: 13px; color: #78350f;">(Giảm ngay 100.000đ trừ thẳng vào đơn hàng đầu tiên của bạn)</div>
            </div>

            <p style="margin-bottom: 24px;">Bạn có thể xem trước cẩm nang độc quyền mà mình đã đúc kết:</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://hangmyxachtay.info.vn/cam-nang-costco.html" style="background: #0f2b48; color: #ffffff; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">📖 Đọc Cẩm Nang Phân Biệt TPCN Thật - Giả</a>
            </div>

            <p>Đơn giản thôi, sức khỏe của gia đình là trên hết. Cứ thong thả xem cẩm nang bạn nhée, mình sẽ sớm gửi thêm một vài kinh nghiệm chọn đồ chuẩn Mỹ rất hay cho bạn sau 2 ngày nữa!</p>
            <p style="margin-top: 30px; margin-bottom: 0;">Thân mến,<br><strong>Dương — CostcoHealth USA</strong><br><span style="color: #64748b; font-size: 13px;">Hotline / Zalo hỗ trợ: 0336.822.318</span></p>
          </div>
          <div style="background: #f8fafc; padding: 16px 30px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
            Bạn nhận được email này vì đã đăng ký nhận quà tại <a href="https://hangmyxachtay.info.vn" style="color: #0284c7; text-decoration: none;">hangmyxachtay.info.vn</a>.
          </div>
        </div>
      `
    };

    // EMAIL 2: Nurture Insight
    const email2 = {
      subject: `Thật ra, đừng vội mua Glucosamine hay Dầu cá Mỹ nếu chưa biết điều này...`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
          <div style="background: #0f2b48; padding: 24px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">CostcoHealth<span style="color: #dc2626;">USA</span></h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Góc chia sẻ kiến thức sức khỏe & Hàng Mỹ chuẩn Air</p>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-top: 0;">Chào <strong>${custName}</strong>,</p>
            <p>Hôm nay mình muốn kể cho bạn nghe một chuyện thật mà rất ít người bán hàng Mỹ dám nói thẳng.</p>
            <p>Nhiều khách nhắn hỏi mình: <em>"Dương ơi, sao lọ Glucosamine Kirkland 375 viên bên bạn bán gần 500k, mà trên mấy sàn thương mại điện tử có nơi bán chỉ 350k - 400k?"</em></p>
            
            <p>Thật ra câu trả lời đơn giản thôi:</p>
            <ul style="padding-left: 20px; margin: 16px 0;">
              <li style="margin-bottom: 10px;"><strong>Một lọ thuốc nặng gần 0.8kg:</strong> Giá niêm yết trên kệ siêu thị Costco bên Mỹ đã tầm $17 – $19 USD (gần 500.000đ tiền vốn mua tại quầy rồi). Chưa tính tiền cước bay Air!</li>
              <li style="margin-bottom: 10px;"><strong>Hàng container đường biển hầm nóng 55–60°C:</strong> Để hạ giá, nhiều nơi cho hàng đi tàu biển lênh đênh cả 2 tháng. Hầm tàu nóng như lò xông hơi làm viên dầu cá chảy dính, hoạt chất glucosamine bị biến tính, mất tác dụng sinh học.</li>
              <li style="margin-bottom: 10px;"><strong>Chiêu trò dập lại hạn sử dụng (Date):</strong> Hàng cận date gom xả lỗ bên Mỹ về được tẩy date in lại hạn mới.</li>
            </ul>

            <p>Uống vào người không những không đỡ đau nhức xương khớp mà gan thận lại phải gánh thêm độc tố.</p>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 8px; margin: 24px 0;">
              <div style="font-weight: 700; color: #1e40af; margin-bottom: 6px;">💡 Mẹo nhỏ kiểm tra hóa đơn Costco thật tại nhà:</div>
              <p style="margin: 0; font-size: 14px; color: #1e3a8a;">Tờ hóa đơn Costco xịn được in bằng <strong>giấy nhiệt độc quyền</strong>. Khi nhận hàng, bạn chỉ cần lấy móng tay miết mạnh một đường lên mặt sau tờ bill — nếu xuất hiện vệt xám nhiệt hóa học thì đó là giấy in nhiệt chuẩn của siêu thị Costco Mỹ, không tiệm photocopy nào ở Việt Nam làm giả được.</p>
            </div>

            <p>Hy vọng mẹo nhỏ này giúp bạn và gia đình an tâm hơn mỗi khi chọn mua thực phẩm chức năng nhée!</p>
            <p style="margin-top: 30px; margin-bottom: 0;">Thân mến,<br><strong>Dương — CostcoHealth USA</strong></p>
          </div>
          <div style="background: #f8fafc; padding: 16px 30px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
            CostcoHealth USA • 100% Bay Air Giữ Lạnh • Kèm Hóa Đơn Gốc Từng Hộp
          </div>
        </div>
      `
    };

    // EMAIL 3: Chốt Ưu Đãi & CTA
    const email3 = {
      subject: `Chuyến bay Air tuần này chuẩn bị hạ cánh (Ưu đãi riêng cho ${custName} ✈️)`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
          <div style="background: #0f2b48; padding: 24px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">CostcoHealth<span style="color: #dc2626;">USA</span></h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Chuyến hàng hỏa tốc chuẩn bị về kho Nội Bài</p>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-top: 0;">Chào <strong>${custName}</strong>,</p>
            <p>Kiện hàng xách tay bay Air giữ mát tuần này từ siêu thị Costco California của bên mình vừa chuẩn bị đáp sân bay Nội Bài. Toàn bộ đều là date mới tinh 2027–2028, nguyên seal nắp hộp và kèm hóa đơn giấy gốc mua tại quầy.</p>
            
            <p>Nếu bạn đang tìm một giải pháp sức khỏe thật sự an tâm cho gia đình:</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 18px 0;">
              <div style="margin-bottom: 12px;">🦴 <strong>Kirkland Glucosamine 1500mg with MSM (375v - 495.000đ):</strong> Uống được tận 6 tháng. Bố mẹ uống 3–4 tuần là đầu gối bớt khô khục, đi lại lên cầu thang êm ru nhẹ nhàng.</div>
              <div style="margin-bottom: 12px;">👁️ <strong>Kirkland Wild Alaskan Fish Oil (230v - 520.000đ):</strong> Dầu cá hồi Alaska ép lạnh, viên nang trong suốt vàng óng, không tanh ợ ngược, sáng mắt và giảm mỏi mệt.</div>
              <div>🍓 <strong>Natrol Biotin 10.000 mcg (60v ngậm dâu - 280.000đ):</strong> Ngậm tan nhanh trong miệng, kích thích chân tóc mọc khỏe, dứt điểm rụng tóc sau 3 tuần.</div>
            </div>

            <p>Mã Voucher <strong>COSTCO100K</strong> của bạn vẫn còn hiệu lực để giảm ngay 100.000đ cho chuyến bay này.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://hangmyxachtay.info.vn/thanh-toan.html" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 16px 36px; border-radius: 9999px; text-decoration: none; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 10px 25px rgba(220, 38, 38, 0.35);">🛒 ĐẶT HÀNG & NHẬN BILL COSTCO TẠI ĐÂY</a>
            </div>

            <p style="font-size: 13px; color: #64748b; text-align: center;"><em>(Chính sách đồng kiểm: Được mở hộp kiểm tra bill gốc trước khi thanh toán. Phát hiện không chuẩn, đền 200% tiền mặt ngay lập tức).</em></p>

            <p style="margin-top: 30px; margin-bottom: 0;">Thân mến,<br><strong>Dương — CostcoHealth USA</strong><br><span style="color: #64748b; font-size: 13px;">Hotline / Zalo: 0336.822.318</span></p>
          </div>
          <div style="background: #f8fafc; padding: 16px 30px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
            CostcoHealth USA • Cổng thanh toán VietQR: <a href="https://hangmyxachtay.info.vn/thanh-toan.html" style="color: #0284c7; text-decoration: none;">hangmyxachtay.info.vn/thanh-toan.html</a>
          </div>
        </div>
      `
    };

    // Helper hàm gửi 1 email qua Resend API
    async function sendSingleEmail(subject, html) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: SENDER,
          to: [email],
          subject: subject,
          html: html
        })
      });
      return await res.json();
    }

    const results = [];

    const isTestAll = email.includes('+testall') || testMode === 'all';

    if (isTestAll) {
      // GỬI CẢ 3 EMAIL NẾU CHỦ ĐỘNG TEST TOÀN BỘ CHUỖI (+testall)
      console.log(`[TEST ALL MODE] Gửi cả 3 email cho: ${email}`);
      const r1 = await sendSingleEmail(email1.subject, email1.html);
      results.push({ emailIndex: 1, name: 'Email 1 - Chào mừng', result: r1 });

      await new Promise(resolve => setTimeout(resolve, 1500));
      const r2 = await sendSingleEmail(email2.subject, email2.html);
      results.push({ emailIndex: 2, name: 'Email 2 - Nurture Insight', result: r2 });

      await new Promise(resolve => setTimeout(resolve, 1500));
      const r3 = await sendSingleEmail(email3.subject, email3.html);
      results.push({ emailIndex: 3, name: 'Email 3 - Chốt & Thanh Toán', result: r3 });

      return res.status(200).json({
        success: true,
        mode: 'TEST_MODE_ALL_3_SENT',
        message: 'Đã gửi cả 3 email sequence ngay lập tức theo chế độ test all!',
        recipient: email,
        sender: SENDER,
        results: results
      });
    } else {
      // ĐIỀN FORM CHỜ / TEST END-TO-END (+test): CHỈ GỬI DUY NHẤT EMAIL 1 CHÀO MỪNG!
      // (Đảm bảo khách chỉ nhận thư chào mừng vào Thư chính, không bị trôi hay lẫn thư ngày 2, ngày 3)
      console.log(`[WELCOME EMAIL SENT] Gửi Email 1 Chào mừng cho: ${email}`);
      const r1 = await sendSingleEmail(email1.subject, email1.html);
      results.push({ emailIndex: 1, name: 'Email 1 - Chào mừng', result: r1 });

      return res.status(200).json({
        success: true,
        mode: 'WELCOME_EMAIL_SENT',
        message: 'Đã gửi Email 1 Chào Mừng trực tiếp vào Hộp thư chính của khách hàng.',
        recipient: email,
        sender: SENDER,
        results: results
      });
    }
  } catch (error) {
    console.error('Lỗi khi gửi email sequence:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
