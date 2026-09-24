import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env từ thư mục gốc dự án
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const app = express();
const PORT = process.env.MCP_PORT || 3001;
const HOST = process.env.MCP_HOST || '0.0.0.0'; // Lắng nghe trên mọi interface nội bộ

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Đường dẫn file dự án
const getFilePath = (relPath) => {
  // Ưu tiên đường dẫn chuẩn trên VPS nếu tồn tại
  const vpsPath = path.join('/var/www/costcohealth', relPath);
  if (fs.existsSync(vpsPath)) return vpsPath;
  return path.join(rootDir, relPath);
};

// Logger tiện ích với timestamp
function logMCP(action, details = {}) {
  const ts = new Date().toISOString();
  console.log(`[MCP] [${ts}] [${action}]`, JSON.stringify(details));
}

// ==============================================================================
// 1. ĐỊNH NGHĨA 3 MCP TOOLS THEO CHUẨN MODEL CONTEXT PROTOCOL
// ==============================================================================
const TOOLS = [
  {
    name: 'update_hero_title',
    description: 'Cập nhật trực tiếp tiêu đề chính (hero title) và mô tả phụ trên landing page website CostcoHealth USA.',
    inputSchema: {
      type: 'object',
      properties: {
        new_title: {
          type: 'string',
          description: 'Tiêu đề chính mới muốn hiển thị trên banner trang chủ (ví dụ: "⚡ Flash Sale Cuối Tuần: Giảm 30% Toàn Bộ TPCN Bay Air")'
        },
        new_subtitle: {
          type: 'string',
          description: 'Đoạn mô tả phụ bên dưới tiêu đề (tùy chọn)'
        }
      },
      required: ['new_title']
    }
  },
  {
    name: 'get_today_orders',
    description: 'Tra cứu và báo cáo tổng hợp danh sách đơn hàng, số tiền đã thanh toán VietQR SePay và tổng doanh thu bán hàng.',
    inputSchema: {
      type: 'object',
      properties: {
        filter_date: {
          type: 'string',
          description: 'Bộ lọc ngày: "today" (hôm nay, mặc định), "yesterday" (hôm qua), hoặc "all" (toàn bộ)'
        }
      }
    }
  },
  {
    name: 'update_product_price',
    description: 'Cập nhật giá bán lẻ của một sản phẩm trên website và catalog giỏ hàng của CostcoHealth USA.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description: 'Mã định danh sản phẩm: p1 (Glucosamine), p2 (Dầu cá), p3 (Collagen), p4 (Move Free), p5 (Biotin), p6 (Ginkgo)'
        },
        new_price: {
          type: 'number',
          description: 'Giá bán mới tính bằng VNĐ (ví dụ: 550000)'
        }
      },
      required: ['product_id', 'new_price']
    }
  }
];

// ==============================================================================
// 2. LOGIC THỰC THI CHO TỪNG TOOL
// ==============================================================================

// TOOL 1: update_hero_title
async function handleUpdateHeroTitle(args) {
  const { new_title, new_subtitle } = args || {};
  if (!new_title || typeof new_title !== 'string') {
    throw new Error('Tham số new_title là bắt buộc và phải là chuỗi ký tự.');
  }

  const indexPath = getFilePath('index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Không tìm thấy file index.html tại ${indexPath}`);
  }

  let html = fs.readFileSync(indexPath, 'utf-8');

  // Regex thay thế tiêu đề trong <h1 class="hero-title">...</h1>
  const heroTitleRegex = /(<h1\s+class=["']hero-title["'][^>]*>)([\s\S]*?)(<\/h1>)/i;
  if (!heroTitleRegex.test(html)) {
    throw new Error('Không tìm thấy thẻ <h1 class="hero-title"> trong index.html');
  }

  // Giữ lại cấu trúc thẻ span highlight nếu tiêu đề dài
  const updatedHeroTitle = `$1\n          ${new_title.trim()}\n        $3`;
  html = html.replace(heroTitleRegex, updatedHeroTitle);

  // Cập nhật subtitle nếu có truyền vào
  if (new_subtitle && typeof new_subtitle === 'string') {
    const subtitleRegex = /(<p\s+class=["']hero-subtitle["'][^>]*>)([\s\S]*?)(<\/p>)/i;
    if (subtitleRegex.test(html)) {
      html = html.replace(subtitleRegex, `$1\n          ${new_subtitle.trim()}\n        $3`);
    }
  }

  fs.writeFileSync(indexPath, html, 'utf-8');

  logMCP('UPDATE_HERO_TITLE_SUCCESS', { new_title, new_subtitle, file: indexPath });

  return {
    success: true,
    message: 'Đã cập nhật tiêu đề landing page trên website thành công!',
    new_title: new_title.trim(),
    new_subtitle: new_subtitle ? new_subtitle.trim() : 'Giữ nguyên subtitle cũ',
    updated_file: indexPath,
    updated_at: new Date().toISOString()
  };
}

// TOOL 2: get_today_orders
async function handleGetTodayOrders(args) {
  const filter = (args?.filter_date || 'today').toLowerCase().trim();
  const GOOGLE_CLOUD_URL = process.env.GOOGLE_CLOUD_URL;
  let orders = [];

  // 1. Thử lấy từ Google Sheets Cloud DB
  if (GOOGLE_CLOUD_URL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${GOOGLE_CLOUD_URL}?action=get_orders`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.orders)) {
          orders = data.orders;
        }
      }
    } catch (e) {
      logMCP('GOOGLE_CLOUD_FETCH_FALLBACK', { error: e.message });
    }
  }

  // 2. Nếu Google Sheets không có hoặc offline, đọc từ crm_data.json
  if (orders.length === 0) {
    const crmPath = getFilePath('crm_data.json');
    if (fs.existsSync(crmPath)) {
      try {
        const crmData = JSON.parse(fs.readFileSync(crmPath, 'utf-8'));
        orders = crmData.orders || [];
      } catch (err) {}
    }
  }

  // Tính toán số liệu báo cáo
  const todayStr = new Date().toISOString().split('T')[0];
  const paidOrders = orders.filter(o => (o.status || '').toLowerCase() === 'success');
  const pendingOrders = orders.filter(o => (o.status || '').toLowerCase() !== 'success');

  const totalRevenue = paidOrders.reduce((sum, o) => {
    const val = parseInt(o.paid_amount || o.amount || o.total || 0) || 0;
    return sum + val;
  }, 0);

  logMCP('GET_TODAY_ORDERS_SUCCESS', { count: orders.length, revenue: totalRevenue });

  return {
    success: true,
    report_date: todayStr,
    filter_applied: filter,
    summary: {
      total_orders: orders.length,
      paid_orders_count: paidOrders.length,
      pending_orders_count: pendingOrders.length,
      total_revenue_vnd: totalRevenue,
      formatted_revenue: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)
    },
    recent_orders: orders.slice(-5).map(o => ({
      order_id: o.id || o.order_id,
      customer: o.customer_name || o.customer,
      amount: o.amount || o.total,
      status: o.status,
      created_at: o.created_at || o.paid_at
    }))
  };
}

// TOOL 3: update_product_price
async function handleUpdateProductPrice(args) {
  const { product_id, new_price } = args || {};
  if (!product_id || typeof product_id !== 'string') {
    throw new Error('Thiếu tham số product_id (ví dụ: "p1", "p2",...)');
  }
  const priceNum = parseInt(new_price);
  if (isNaN(priceNum) || priceNum <= 0) {
    throw new Error('new_price phải là một số nguyên dương hợp lệ.');
  }

  const pKey = product_id.toLowerCase().trim();
  const crmPath = getFilePath('crm_data.json');
  const scriptPath = getFilePath('script.js');

  let productName = pKey;

  // Cập nhật crm_data.json nếu tồn tại
  if (fs.existsSync(crmPath)) {
    try {
      const crm = JSON.parse(fs.readFileSync(crmPath, 'utf-8'));
      const idMap = { 'p1': 1, 'p2': 2, 'p3': 3, 'p4': 4, 'p5': 5, 'p6': 6 };
      const targetId = idMap[pKey] || parseInt(pKey.replace(/\D/g, ''));
      const product = crm.products?.find(p => p.id === targetId);
      if (product) {
        product.price = priceNum;
        productName = product.name;
        fs.writeFileSync(crmPath, JSON.stringify(crm, null, 2), 'utf-8');
      }
    } catch (e) {}
  }

  // Cập nhật giá hiển thị trực tiếp trên landing page index.html
  const indexPath = getFilePath('index.html');
  if (fs.existsSync(indexPath)) {
    try {
      let indexHtml = fs.readFileSync(indexPath, 'utf-8');
      const idMap = {
        'p1': 'Kirkland Glucosamine 375 viên',
        'p2': 'Dầu cá Kirkland Wild Alaskan Fish Oil',
        'p3': 'Collagen Youtheory 390 viên',
        'p4': 'Schiff Move Free Ultra',
        'p5': 'Natrol Biotin 10,000 mcg',
        'p6': 'Trunature Ginkgo Biloba 120mg'
      };
      const cardDataAttr = idMap[pKey];
      if (cardDataAttr) {
        const formattedVnd = priceNum.toLocaleString('vi-VN') + 'đ';
        const cardRegex = new RegExp(`(data-product=["']${cardDataAttr}["'][\\s\\S]*?<span class=["']price-current["']>)[^<]+(</span>)`, 'i');
        if (cardRegex.test(indexHtml)) {
          indexHtml = indexHtml.replace(cardRegex, `$1${formattedVnd}$2`);
          fs.writeFileSync(indexPath, indexHtml, 'utf-8');
        }
      }
    } catch (e) {
      logMCP('UPDATE_INDEX_PRICE_ERROR', { error: e.message });
    }
  }

  // Cập nhật PRODUCT_CATALOG trong script.js
  if (fs.existsSync(scriptPath)) {
    try {
      let scriptContent = fs.readFileSync(scriptPath, 'utf-8');
      const priceRegex = new RegExp(`('${pKey}'\\s*:\\s*{[^{}]*?price:\\s*)\\d+`, 'i');
      if (priceRegex.test(scriptContent)) {
        scriptContent = scriptContent.replace(priceRegex, `$1${priceNum}`);
        fs.writeFileSync(scriptPath, scriptContent, 'utf-8');
      }
    } catch (e) {}
  }

  logMCP('UPDATE_PRODUCT_PRICE_SUCCESS', { product_id: pKey, new_price: priceNum, productName });

  return {
    success: true,
    message: `Đã cập nhật giá bán mới cho sản phẩm [${pKey}] thành công!`,
    product_id: pKey,
    product_name: productName,
    new_price_vnd: priceNum,
    formatted_price: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceNum),
    updated_at: new Date().toISOString()
  };
}

// ==============================================================================
// 3. HTTP / MCP TRANSPORT HANDLERS (STREAMABLE-HTTP & REST)
// ==============================================================================

// Healthcheck & Web UI preview
app.get(['/health', '/mcp', '/'], (req, res) => {
  res.json({
    status: 'ok',
    server: 'CostcoHealth USA - MCP Server',
    version: '1.0.0',
    transport: 'streamable-http',
    port: PORT,
    timestamp: new Date().toISOString(),
    tools_count: TOOLS.length,
    tools: TOOLS.map(t => ({ name: t.name, description: t.description }))
  });
});

// Xử lý JSON-RPC 2.0 giao thức Model Context Protocol (MCP)
async function handleMcpRpc(req, res) {
  const { jsonrpc, id, method, params } = req.body || {};

  logMCP('RPC_REQUEST', { method, id });

  try {
    // 1. Method: initialize
    if (method === 'initialize') {
      return res.json({
        jsonrpc: '2.0',
        id: id || 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: false }
          },
          serverInfo: {
            name: 'costcohealth-mcp',
            version: '1.0.0'
          }
        }
      });
    }

    // 2. Method: notifications/initialized
    if (method === 'notifications/initialized') {
      return res.status(200).json({ jsonrpc: '2.0', result: {} });
    }

    // 3. Method: ping
    if (method === 'ping') {
      return res.json({ jsonrpc: '2.0', id, result: {} });
    }

    // 4. Method: tools/list
    if (method === 'tools/list') {
      return res.json({
        jsonrpc: '2.0',
        id: id || 1,
        result: {
          tools: TOOLS
        }
      });
    }

    // 5. Method: tools/call
    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      let toolResult;
      if (toolName === 'update_hero_title') {
        toolResult = await handleUpdateHeroTitle(toolArgs);
      } else if (toolName === 'get_today_orders') {
        toolResult = await handleGetTodayOrders(toolArgs);
      } else if (toolName === 'update_product_price') {
        toolResult = await handleUpdateProductPrice(toolArgs);
      } else {
        return res.status(404).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Tool không tồn tại: ${toolName}` }
        });
      }

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(toolResult, null, 2)
            }
          ]
        }
      });
    }

    // Direct REST API Helper cho curl test đơn giản
    if (method === undefined && req.body?.tool) {
      const toolName = req.body.tool;
      const toolArgs = req.body.args || {};
      let result;
      if (toolName === 'update_hero_title') result = await handleUpdateHeroTitle(toolArgs);
      else if (toolName === 'get_today_orders') result = await handleGetTodayOrders(toolArgs);
      else if (toolName === 'update_product_price') result = await handleUpdateProductPrice(toolArgs);
      return res.json({ success: true, result });
    }

    return res.status(400).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32600, message: `Yêu cầu không hợp lệ hoặc method chưa hỗ trợ: ${method}` }
    });
  } catch (error) {
    logMCP('RPC_ERROR', { method, error: error.message });
    return res.status(500).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: error.message }
    });
  }
}

// Đăng ký cả /mcp và /
app.post(['/mcp', '/'], handleMcpRpc);

// Khởi chạy Server
app.listen(PORT, HOST, () => {
  logMCP('SERVER_STARTED', { port: PORT, host: HOST, url: `http://${HOST}:${PORT}/mcp` });
});
