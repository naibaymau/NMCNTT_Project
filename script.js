/* ==========================================================================
   GPTea Coffee Shop - Core Application Script
   ========================================================================== */

// Utility functions
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const money = (n) => Number(n || 0).toLocaleString('vi-VN') + '₫';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const load = (k, d) => {
  try {
    const v = localStorage.getItem('ts_' + k);
    return v ? JSON.parse(v) : d;
  } catch (e) {
    return d;
  }
};

const save = (k, v) => {
  try {
    localStorage.setItem('ts_' + k, JSON.stringify(v));
  } catch (e) {}
};

// Clipboard copy utility
function copyToClipboard(text, label) {
  if (!text) return;
  const cleanText = String(text).trim();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(cleanText)
      .then(() => toast(`Đã sao chép ${label || 'nội dung'}: ${cleanText}`))
      .catch(() => fallbackCopy(cleanText, label));
  } else {
    fallbackCopy(cleanText, label);
  }
}

function fallbackCopy(text, label) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    toast(`Đã sao chép ${label || 'nội dung'}: ${text}`);
  } catch (e) {
    toast(`Vui lòng sao chép thủ công: ${text}`);
  }
  document.body.removeChild(ta);
}

// Fallback QR code SVG khi offline hoặc ảnh lỗi
function handleQrError(img) {
  if (!img) return;
  img.onerror = null;
  img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='200' height='200'><rect width='200' height='200' fill='%23ffffff'/><rect x='20' y='20' width='50' height='50' fill='%231d4a3e'/><rect x='30' y='30' width='30' height='30' fill='%23ffffff'/><rect x='38' y='38' width='14' height='14' fill='%231d4a3e'/><rect x='130' y='20' width='50' height='50' fill='%231d4a3e'/><rect x='140' y='30' width='30' height='30' fill='%23ffffff'/><rect x='148' y='38' width='14' height='14' fill='%231d4a3e'/><rect x='20' y='130' width='50' height='50' fill='%231d4a3e'/><rect x='30' y='140' width='30' height='30' fill='%23ffffff'/><rect x='38' y='148' width='14' height='14' fill='%231d4a3e'/><circle cx='100' cy='100' r='18' fill='%231d4a3e'/><text x='100' y='105' font-size='12' font-family='sans-serif' text-anchor='middle' fill='%23ffffff' font-weight='bold'>QR</text><rect x='85' y='25' width='12' height='12' fill='%231d4a3e'/><rect x='105' y='35' width='12' height='12' fill='%231d4a3e'/><rect x='85' y='145' width='15' height='15' fill='%231d4a3e'/><rect x='135' y='135' width='20' height='20' fill='%231d4a3e'/><rect x='160' y='160' width='15' height='15' fill='%231d4a3e'/><rect x='115' y='165' width='15' height='15' fill='%231d4a3e'/></svg>";
}

/* ==========================================================================
   CONFIGURATIONS & SEED DATA
   ========================================================================== */

// 1. Cấu hình hình thức thanh toán & Placeholder dữ liệu
// Dễ dàng thay thế số tài khoản, tên chủ thẻ, ngân hàng và ảnh QR thực tế tại đây
const PAYMENT_CONFIG = {
  cod: {
    id: 'cod',
    name: 'Thanh toán khi nhận hàng (COD)',
    icon: '💵',
    desc: 'Thanh toán tiền mặt cho nhân viên giao hàng khi nhận được kiện trà'
  },
  momo: {
    id: 'momo',
    name: 'Thanh toán qua Ví MoMo',
    icon: '🟣',
    providerName: 'Ví điện tử MoMo',
    accountLabel: 'Số điện thoại MoMo',
    accountNumber: '0987 654 321', // [PLACEHOLDER - Thay bằng SĐT MoMo nhận tiền thực tế]
    accountName: 'GPTEA COFFEE SHOP', // [PLACEHOLDER - Tên chủ ví]
    syntaxPrefix: 'MOMO', // Cú pháp: MOMO [Mã_Đơn_Hàng]
    qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=2|99|0987654321|GPTEA|0|0|0|Thanh+toan+don+hang+GPTea',
    instruction: 'Mở ứng dụng MoMo, chọn Quét Mã QR hoặc chuyển khoản đến số điện thoại ở trên.'
  },
  bank: {
    id: 'bank',
    name: 'Thanh toán qua Ngân hàng (Chuyển khoản)',
    icon: '🏦',
    providerName: 'MB BANK (Ngân hàng TMCP Quân Đội)', // [PLACEHOLDER - Tên Ngân hàng]
    accountLabel: 'Số tài khoản',
    accountNumber: '9999 8888 6868', // [PLACEHOLDER - Thay bằng STK thực tế]
    accountName: 'GPTEA COFFEE SHOP', // [PLACEHOLDER - Tên chủ tài khoản]
    syntaxPrefix: 'GPTEA', // Cú pháp: GPTEA [Mã_Đơn_Hàng]
    qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=00020101021238580010A0000007270126000697042201129999888868685204000053037045802VN62150811GPTEA',
    instruction: 'Mở app ngân hàng bất kỳ, quét mã VietQR hoặc chuyển khoản vào số tài khoản ở trên.'
  }
};

// 2. Danh sách mã giảm giá Voucher
const COUPONS = {
  TRA10: { pct: 10, txt: 'Giảm 10% đơn hàng' },
  FREESHIP: { ship: 0, txt: 'Miễn phí vận chuyển' },
  GPTEA20: { amount: 20000, txt: 'Giảm 20.000₫ đơn hàng' }
};

// 3. Danh mục sản phẩm khởi tạo
const SEED = [
  { id: 1, name: 'Trà ô long Thái Nguyên', cat: 'Ô long', price: 180000, emoji: '🍵', bg: '#cfe6d8', desc: 'Hương hoa nhẹ, hậu vị ngọt, sao lửa vừa truyền thống.' },
  { id: 2, name: 'Trà xanh Tân Cương', cat: 'Trà xanh', price: 120000, emoji: '🌿', bg: '#d9ecc9', desc: 'Búp non 1 tôm 2 lá, nước xanh sáng, vị chát thanh dịu.' },
  { id: 3, name: 'Trà shan tuyết Hà Giang', cat: 'Trà cổ thụ', price: 350000, emoji: '🏔️', bg: '#dfe8ef', desc: 'Cây cổ thụ trên 200 năm tuổi trên mây cao, vị đậm sâu lắng.' },
  { id: 4, name: 'Hồng trà Mộc Châu', cat: 'Hồng trà', price: 150000, emoji: '🍂', bg: '#f1d9c4', desc: 'Lên men nhẹ, thơm mật ong rừng, rất hợp pha trà sữa.' },
  { id: 5, name: 'Trà sen Tây Hồ', cat: 'Trà hương', price: 420000, emoji: '🪷', bg: '#f3dbe5', desc: 'Ướp thủ công từ gạo hoa sen bách diệp buổi sớm tinh mơ.' },
  { id: 6, name: 'Trà lài Bảo Lộc', cat: 'Trà hương', price: 160000, emoji: '🌼', bg: '#fef3c7', desc: 'Hoa lài tươi thơm ngát quyện vị chát ngọt dịu của trà cao nguyên.' },
  { id: 7, name: 'Trà hoa cúc mật ong', cat: 'Trà thảo mộc', price: 135000, emoji: '🌻', bg: '#fef9c3', desc: 'Hoa cúc sấy lạnh kết hợp mật ong rừng, thanh nhiệt ngủ ngon.' },
  { id: 8, name: 'Trà Thiết Quan Âm', cat: 'Ô long', price: 290000, emoji: '🍃', bg: '#dcfce7', desc: 'Dòng trà Ô long nức tiếng, nước vàng óng ả, hương lan thoang thoảng.' },
  { id: 9, name: 'Trà đen Ceylon', cat: 'Hồng trà', price: 175000, emoji: '🫖', bg: '#fed7aa', desc: 'Đậm đà chuẩn phong cách trà chiều, vị tròn đầy êm ái.' },
  { id: 10, name: 'Trà gạo lứt huyết rồng', cat: 'Trà thảo mộc', price: 110000, emoji: '🌾', bg: '#e2e8f0', desc: 'Rang mộc thơm ngậy, thanh lọc cơ thể nhẹ nhàng mỗi ngày.' },
  { id: 11, name: 'Trà Phổ Nhĩ chín Vân Nam', cat: 'Trà cổ thụ', price: 450000, emoji: '🪵', bg: '#e7e5e4', desc: 'Bánh trà lên men lâu năm, hậu vị ngọt sâu lắng, ấm bụng.' },
  { id: 12, name: 'Trà bạc hà sảng khoái', cat: 'Trà thảo mộc', price: 95000, emoji: '🌱', bg: '#ccfbf1', desc: 'Lá bạc hà tươi sấy lạnh, the mát sảng khoái bừng tỉnh tinh thần.' },
  { id: 13, name: 'Trà Matcha Kyoto', cat: 'Trà xanh', price: 320000, emoji: '🍵', bg: '#bbf7d0', desc: 'Bột trà xanh nghiền cối đá, màu ngọc bích, vị umami ngậy béo.' },
  { id: 14, name: 'Trà đào cam sả', cat: 'Trà trái cây', price: 140000, emoji: '🍑', bg: '#ffedd5', desc: 'Hương đào chín thơm lừng kết hợp cam vàng và sả thảo mộc.' },
  { id: 15, name: 'Trà hoa hồng Damask', cat: 'Trà hương', price: 210000, emoji: '🌹', bg: '#fce7f3', desc: 'Nụ hồng sấy thăng hoa thơm quý phái, làm đẹp da thư giãn.' },
  { id: 16, name: 'Trà atiso đỏ khô', cat: 'Trà thảo mộc', price: 90000, emoji: '🌺', bg: '#f2cfd0', desc: 'Chua nhẹ thanh khiết, màu đỏ ruby rực rỡ, không caffeine.' }
];

/* ==========================================================================
   APP STATE
   ========================================================================== */

let products = load('products', SEED),
    cart = load('cart', []),
    wish = load('wish', []),
    orders = load('orders', []),
    reviews = load('reviews', { 1: [{ u: 'Lan', s: 5, t: 'Thơm, uống êm và hậu vị rất ngọt.' }] }),
    users = load('users', []),
    me = load('me', null),
    view = 'home',
    arg = null,
    coupon = null,
    selectedPaymentMethod = 'cod', // 'cod' | 'momo' | 'bank'
    F = { q: '', cat: '', sort: '', max: '' };

/* ==========================================================================
   HELPER FUNCTIONS
   ========================================================================== */

function toast(m) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = m;
  t.hidden = false;
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.hidden = true), 2500);
}

function go(v, a) {
  view = v;
  arg = a ?? null;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function avg(id) {
  const r = reviews[id] || [];
  return r.length ? r.reduce((a, b) => a + b.s, 0) / r.length : 0;
}

function stars(n) {
  return '<span class="star">' + '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n)) + '</span>';
}

function pcard(p) {
  return `
    <div class="card">
      <div class="pimg" style="background:${p.bg}">${p.emoji}</div>
      <div class="row sp">
        <b>${esc(p.name)}</b>
        <button class="heart ${wish.includes(p.id) ? 'on' : ''}" aria-label="Yêu thích" onclick="toggleWish(${p.id})">♥</button>
      </div>
      <div class="mute">${esc(p.cat)} · ${stars(avg(p.id))}</div>
      <div class="row sp" style="margin-top:8px">
        <span class="price">${money(p.price)}</span>
        <span>
          <button class="btn alt sm" onclick="go('detail',${p.id})">Chi tiết</button>
          <button class="btn sm" onclick="addCart(${p.id})">Thêm</button>
        </span>
      </div>
    </div>
  `;
}

function totals() {
  const sub = cart.reduce((a, i) => {
    const p = products.find(x => x.id === i.id);
    return a + (p ? p.price * i.q : 0);
  }, 0);

  let disc = 0;
  if (coupon && COUPONS[coupon]) {
    if (COUPONS[coupon].pct) {
      disc = Math.round((sub * COUPONS[coupon].pct) / 100);
    } else if (COUPONS[coupon].amount) {
      disc = Math.min(sub, COUPONS[coupon].amount);
    }
  }

  const ship = sub === 0 || sub >= 500000 || (coupon && COUPONS[coupon]?.ship === 0) ? 0 : 30000;
  const total = Math.max(0, sub - disc + ship);

  return { sub, disc, ship, total };
}

function sumHtml(t) {
  return `
    <div class="row sp" style="margin-bottom:8px"><span>Tổng tiền tạm tính:</span><b>${money(t.sub)}</b></div>
    <div class="row sp" style="margin-bottom:8px"><span>Giảm giá:</span><span style="color:var(--tea)">-${money(t.disc)}</span></div>
    <div class="row sp" style="margin-bottom:8px"><span>Phí vận chuyển:</span><span>${t.ship ? money(t.ship) : 'Miễn phí'}</span></div>
    <hr style="margin:12px 0; border:none; border-top:1px dashed var(--line);">
    <div class="row sp"><b style="font-size:16px">Tổng cộng:</b><b class="price" style="font-size:18px">${money(t.total)}</b></div>
  `;
}

/* ==========================================================================
   VIEWS (GIAO DIỆN CÁC TRANG)
   ========================================================================== */

const V = {
  home() {
    return `
      <div class="hero">
        <h1>Về chúng tôi</h1>
        <p>Bên cạnh niềm tự hào về những mẻ trà thảo mộc thơm lành – sạch – tự nhiên, GPTea luôn tự tin mang đến quý khách những trải nghiệm tốt nhất về hương vị và sự thư thái.</p>
        <button class="btn" onclick="go('catalog')">Khám phá sản phẩm</button>
      </div>
      <div class="note">
        🍃 Đơn hàng từ 500.000₫ được <b>Miễn phí vận chuyển toàn quốc</b>. Nhập mã <b>TRA10</b> để được giảm ngay 10%!
      </div>
      <h2>Sản phẩm nổi bật</h2>
      <div class="grid">${products.slice(0, 4).map(pcard).join('')}</div>
    `;
  },

  catalog() {
    let list = products.filter(p =>
      (p.name + p.cat).toLowerCase().includes(F.q.toLowerCase()) &&
      (!F.cat || p.cat === F.cat) &&
      (!F.max || p.price <= +F.max)
    );
    if (F.sort === 'asc') list.sort((a, b) => a.price - b.price);
    if (F.sort === 'desc') list.sort((a, b) => b.price - a.price);
    if (F.sort === 'rate') list.sort((a, b) => avg(b.id) - avg(a.id));
    const cats = [...new Set(products.map(p => p.cat))];

    return `
      <h2>Danh mục sản phẩm</h2>
      <div class="bar">
        <input id="fq" placeholder="Tìm kiếm tên trà, loại trà..." value="${esc(F.q)}" oninput="F.q=this.value;list()">
        <select onchange="F.cat=this.value;list()">
          <option value="">Tất cả loại trà</option>
          ${cats.map(c => `<option ${F.cat === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <select onchange="F.max=this.value;list()">
          <option value="">Mọi mức giá</option>
          <option value="150000" ${F.max == '150000' ? 'selected' : ''}>Dưới 150.000₫</option>
          <option value="300000" ${F.max == '300000' ? 'selected' : ''}>Dưới 300.000₫</option>
        </select>
        <select onchange="F.sort=this.value;list()">
          <option value="">Sắp xếp</option>
          <option value="asc" ${F.sort == 'asc' ? 'selected' : ''}>Giá tăng dần</option>
          <option value="desc" ${F.sort == 'desc' ? 'selected' : ''}>Giá giảm dần</option>
          <option value="rate" ${F.sort == 'rate' ? 'selected' : ''}>Đánh giá cao nhất</option>
        </select>
      </div>
      <div class="grid" id="plist">
        ${list.length ? list.map(pcard).join('') : '<p class="mute" style="grid-column: 1/-1; padding: 30px; text-align: center;">Không có sản phẩm nào khớp với bộ lọc của bạn.</p>'}
      </div>
    `;
  },

  detail() {
    const p = products.find(x => x.id === arg);
    if (!p) return '<p>Không tìm thấy sản phẩm.</p>';
    const rs = reviews[p.id] || [];
    return `
      <button class="btn alt sm" onclick="go('catalog')">← Quay lại danh mục</button>
      <div class="two" style="margin-top:14px">
        <div class="pimg card" style="background:${p.bg};height:300px;font-size:120px">${p.emoji}</div>
        <div>
          <h2>${esc(p.name)}</h2>
          <p class="mute">${esc(p.cat)} · ${stars(avg(p.id))} (${rs.length} đánh giá)</p>
          <p style="margin: 14px 0; line-height: 1.6;">${esc(p.desc)}</p>
          <p class="price" style="font-size:26px; margin: 16px 0;">${money(p.price)}</p>
          <div class="row">
            <label style="margin:0">Số lượng:</label>
            <input id="qty" type="number" min="1" value="1" style="width:80px">
            <button class="btn" onclick="addCart(${p.id},+$('#qty').value)">Thêm vào giỏ</button>
            <button class="heart ${wish.includes(p.id) ? 'on' : ''}" onclick="toggleWish(${p.id})">♥</button>
          </div>
        </div>
      </div>
      <h3 style="margin-top:28px">Đánh giá từ khách hàng</h3>
      ${rs.map(r => `<div class="card" style="margin-bottom:8px"><b>${esc(r.u)}</b> ${stars(r.s)}<br><span style="margin-top:4px;display:inline-block">${esc(r.t)}</span></div>`).join('') || '<p class="mute">Chưa có đánh giá nào cho sản phẩm này.</p>'}
      <div class="card" style="margin-top:12px">
        <h4 style="margin:0 0 10px;">Gửi đánh giá của bạn</h4>
        <label>Mức độ hài lòng</label>
        <select id="rs"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select>
        <label>Nhận xét chi tiết</label>
        <textarea id="rt" rows="2" placeholder="Cảm nhận về hương vị, bao bì..."></textarea>
        <br><br>
        <button class="btn" onclick="addReview(${p.id})">Gửi đánh giá</button>
      </div>
    `;
  },

  wish() {
    const l = products.filter(p => wish.includes(p.id));
    return `
      <h2>Sản phẩm yêu thích</h2>
      ${l.length ? `<div class="grid">${l.map(pcard).join('')}</div>` : '<p class="mute" style="padding: 30px 0;">Bạn chưa lưu sản phẩm nào. Hãy bấm biểu tượng trái tim ♥ trên sản phẩm để lưu lại nhé.</p>'}
    `;
  },

  cart() {
    if (!cart.length) {
      return `
        <h2>Giỏ hàng</h2>
        <div class="card" style="text-align:center;padding:50px 20px;">
          <p class="mute" style="font-size:16px;">Giỏ hàng của bạn đang trống.</p>
          <button class="btn" onclick="go('catalog')">Chọn sản phẩm ngay</button>
        </div>
      `;
    }
    const t = totals();
    return `
      <h2>Giỏ hàng của bạn</h2>
      <div class="wrap">
        <table>
          <tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th></th></tr>
          ${cart.map(i => {
            const p = products.find(x => x.id === i.id);
            return p ? `
              <tr>
                <td><b>${p.emoji} ${esc(p.name)}</b></td>
                <td>${money(p.price)}</td>
                <td><input type="number" min="1" value="${i.q}" style="width:70px" onchange="setQty(${i.id},+this.value)"></td>
                <td><b class="price">${money(p.price * i.q)}</b></td>
                <td><button class="btn alt sm" onclick="rmCart(${i.id})">Xóa</button></td>
              </tr>
            ` : '';
          }).join('')}
        </table>
      </div>
      <div class="two" style="margin-top:24px">
        <div class="card">
          <b>Mã giảm giá (Voucher)</b>
          <div class="row" style="margin-top:8px">
            <input id="cp" placeholder="Thử TRA10 hoặc FREESHIP" style="flex:1" value="${coupon || ''}">
            <button class="btn" onclick="applyCoupon()">Áp dụng</button>
          </div>
          <p class="mute" style="margin-top:8px;">${coupon ? 'Đang dùng: <b>' + coupon + '</b> – ' + COUPONS[coupon].txt : ''}</p>
        </div>
        <div class="card">
          ${sumHtml(t)}
          <br>
          <button class="btn" style="width:100%" onclick="go('checkout')">Tiến hành thanh toán</button>
        </div>
      </div>
    `;
  },

  /* ==========================================================================
     CHECKOUT VIEW (MÀN HÌNH THANH TOÁN MỚI ĐẦY ĐỦ LOGIC YÊU CẦU)
     ========================================================================== */
  checkout() {
    if (!cart.length) {
      return `
        <h2>Thanh toán</h2>
        <div class="card" style="text-align:center;padding:40px;">
          <p class="mute" style="font-size:16px;">Giỏ hàng của bạn đang trống.</p>
          <button class="btn" onclick="go('catalog')">Khám phá sản phẩm ngay</button>
        </div>
      `;
    }

    const t = totals();
    const nextOrderId = 1000 + orders.length + 1;
    const payConfig = PAYMENT_CONFIG[selectedPaymentMethod] || PAYMENT_CONFIG.cod;
    const syntaxText = (payConfig.syntaxPrefix || 'GPTEA') + ' ' + nextOrderId;

    return `
      <div class="checkout-header" style="margin-bottom: 20px;">
        <button class="btn alt sm" onclick="go('cart')">← Quay lại giỏ hàng</button>
        <h2 style="margin-top: 10px;">Thanh toán đơn hàng</h2>
      </div>

      <div class="two checkout-grid">
        <!-- CỘT TRÁI: THÔNG TIN GIAO HÀNG, PHƯƠNG THỨC THANH TOÁN & MÃ GIẢM GIÁ VOUCHER -->
        <div class="checkout-left">
          
          <!-- Khối 1: Thông tin người nhận -->
          <div class="card" style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 14px; font-size: 17px; color: var(--tea);">1. Thông tin người nhận</h3>
            <label for="cn">Họ và tên <span style="color:var(--err)">*</span></label>
            <input id="cn" placeholder="Ví dụ: Nguyễn Văn A" value="${esc(me?.name || '')}">

            <label for="cph">Số điện thoại <span style="color:var(--err)">*</span></label>
            <input id="cph" placeholder="Ví dụ: 0912345678" type="tel">

            <label for="ca">Địa chỉ nhận hàng <span style="color:var(--err)">*</span></label>
            <textarea id="ca" rows="2" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"></textarea>
          </div>

          <!-- Khối 2: Lựa chọn Hình thức thanh toán -->
          <div class="card" style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 6px; font-size: 17px; color: var(--tea);">2. Lựa chọn hình thức thanh toán</h3>
            <p class="mute" style="margin-bottom: 14px;">Chọn 1 trong 3 phương thức thanh toán thuận tiện dưới đây:</p>

            <div class="payment-methods-list" id="paymentMethodOptions">
              <!-- Phương thức 1: COD -->
              <label class="payment-method-card ${selectedPaymentMethod === 'cod' ? 'selected' : ''}" onclick="handlePaymentMethodChange('cod')">
                <input type="radio" id="paymentMethodCOD" name="payment_method" value="cod" ${selectedPaymentMethod === 'cod' ? 'checked' : ''}>
                <div class="pm-icon">💵</div>
                <div class="pm-info">
                  <div class="pm-title">Thanh toán khi nhận hàng (COD)</div>
                  <div class="pm-desc">Thanh toán tiền mặt cho shipper khi nhận được kiện hàng</div>
                </div>
              </label>

              <!-- Phương thức 2: MoMo -->
              <label class="payment-method-card ${selectedPaymentMethod === 'momo' ? 'selected' : ''}" onclick="handlePaymentMethodChange('momo')">
                <input type="radio" id="paymentMethodMoMo" name="payment_method" value="momo" ${selectedPaymentMethod === 'momo' ? 'checked' : ''}>
                <div class="pm-icon">🟣</div>
                <div class="pm-info">
                  <div class="pm-title">Thanh toán qua Ví MoMo</div>
                  <div class="pm-desc">Quét mã QR MoMo hoặc chuyển khoản qua số điện thoại</div>
                </div>
              </label>

              <!-- Phương thức 3: Ngân hàng -->
              <label class="payment-method-card ${selectedPaymentMethod === 'bank' ? 'selected' : ''}" onclick="handlePaymentMethodChange('bank')">
                <input type="radio" id="paymentMethodBank" name="payment_method" value="bank" ${selectedPaymentMethod === 'bank' ? 'checked' : ''}>
                <div class="pm-icon">🏦</div>
                <div class="pm-info">
                  <div class="pm-title">Thanh toán qua Ngân hàng (Chuyển khoản)</div>
                  <div class="pm-desc">Quét mã VietQR hoặc chuyển khoản qua Internet Banking</div>
                </div>
              </label>
            </div>

            <!-- Khối 3: Khung thông tin thanh toán (Payment Details Box) -->
            <!-- Tự động ẩn khi chọn COD, hiển thị khi chọn MoMo hoặc Ngân hàng -->
            <div id="paymentDetailsBox" class="payment-details-box" style="display: ${selectedPaymentMethod === 'cod' ? 'none' : 'block'};">
              <div class="payment-details-header">
                <div class="payment-details-title" id="paymentDetailsTitle">${payConfig.name || ''}</div>
                <div class="payment-details-badge" id="paymentProviderBadge">${payConfig.providerName || ''}</div>
              </div>

              <div class="payment-details-body">
                <!-- Ô hiển thị mã QR (Placeholder QR image / div) -->
                <div class="payment-qr-container" id="paymentQrContainer">
                  <div class="payment-qr-wrapper" id="paymentQrWrapper">
                    <img id="paymentQrImage" class="payment-qr-img" src="${payConfig.qrImage || ''}" alt="Mã QR thanh toán" onerror="handleQrError(this)">
                  </div>
                  <span class="payment-qr-hint">Quét mã để thanh toán nhanh</span>
                </div>

                <!-- Thông tin tài khoản chuyển khoản (Placeholder data) -->
                <div class="payment-info-container" id="paymentAccountInfoContainer">
                  <div class="payment-info-row">
                    <span class="payment-info-label">Ngân hàng / Ví:</span>
                    <b class="payment-info-value" id="paymentBankName">${payConfig.providerName || ''}</b>
                  </div>

                  <div class="payment-info-row">
                    <span class="payment-info-label" id="paymentAccountLabel">${payConfig.accountLabel || 'Số tài khoản'}:</span>
                    <div class="payment-copy-group">
                      <b class="payment-info-value payment-highlight" id="paymentAccountNumber">${payConfig.accountNumber || ''}</b>
                      <button type="button" class="btn alt sm copy-btn" onclick="copyToClipboard($('#paymentAccountNumber').textContent, 'số tài khoản')">Sao chép</button>
                    </div>
                  </div>

                  <div class="payment-info-row">
                    <span class="payment-info-label">Tên chủ tài khoản:</span>
                    <b class="payment-info-value payment-highlight" id="paymentAccountName">${payConfig.accountName || ''}</b>
                  </div>

                  <div class="payment-info-row">
                    <span class="payment-info-label">Số tiền cần chuyển:</span>
                    <b class="payment-info-value price" id="paymentTransferAmount">${money(t.total)}</b>
                  </div>

                  <!-- Cú pháp / Nội dung chuyển khoản -->
                  <div class="payment-syntax-box" id="paymentSyntaxBox">
                    <span class="payment-syntax-label">Cú pháp / Nội dung chuyển khoản:</span>
                    <div class="payment-copy-group" style="margin-top: 4px;">
                      <b class="payment-syntax-text" id="paymentTransferSyntax">${syntaxText}</b>
                      <button type="button" class="btn sm copy-btn" onclick="copyToClipboard($('#paymentTransferSyntax').textContent, 'nội dung chuyển khoản')">Sao chép</button>
                    </div>
                    <div class="payment-syntax-note" id="paymentInstruction">${payConfig.instruction || 'Vui lòng ghi đúng nội dung để đơn hàng được xác nhận tự động nhanh chóng.'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Khối 4: Mã giảm giá (Voucher) - Đặt phía bên dưới khu vực thông tin thanh toán -->
          <div class="card voucher-card" id="voucherSection" style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 6px; font-size: 16px; color: var(--tea);">3. Mã giảm giá (Voucher)</h3>
            <p class="mute" style="margin-bottom: 10px;">Nhập mã voucher để nhận thêm ưu đãi (Gợi ý: <b>TRA10</b>, <b>FREESHIP</b> hoặc <b>GPTEA20</b>):</p>
            
            <div class="voucher-input-group">
              <input id="checkoutCouponInput" placeholder="Nhập mã voucher..." value="${coupon || ''}">
              <button type="button" class="btn" id="checkoutCouponBtn" onclick="applyCheckoutCoupon()">Áp dụng</button>
            </div>

            <div id="checkoutCouponMsg" style="margin-top: 8px;">
              ${coupon && COUPONS[coupon] ? `
                <div class="voucher-tag-active">
                  <span>Đang áp dụng: <b>${coupon}</b> (${COUPONS[coupon].txt})</span>
                  <button type="button" class="voucher-remove-btn" onclick="removeCheckoutCoupon()" title="Hủy mã">&times;</button>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Thông báo lỗi (nếu có) và Nút Hoàn tất đặt hàng -->
          <p id="cerr" style="color:var(--err); font-weight: 500; margin-bottom: 12px;"></p>
          <button class="btn" id="placeOrderBtn" style="width: 100%; padding: 14px; font-size: 16px; font-weight: 700;" onclick="placeOrder()">
            Hoàn tất đặt hàng (${money(t.total)})
          </button>
        </div>

        <!-- CỘT PHẢI: THÔNG TIN ĐƠN HÀNG (ORDER SUMMARY BOX) -->
        <div class="checkout-right">
          <div class="card order-summary-card" id="orderSummaryBox">
            <h3 style="margin-bottom: 14px; font-size: 17px; color: var(--tea);">Thông tin đơn hàng</h3>

            <!-- Danh sách các sản phẩm: Tên sản phẩm, đơn giá, số lượng, thành tiền -->
            <div class="wrap">
              <table class="order-summary-table" id="orderSummaryTable">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th style="text-align: right;">Đơn giá</th>
                    <th style="text-align: center;">SL</th>
                    <th style="text-align: right;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody id="orderSummaryList">
                  ${cart.map(i => {
                    const p = products.find(x => x.id === i.id);
                    if (!p) return '';
                    return `
                      <tr>
                        <td class="order-product-name">
                          <span class="order-product-emoji" style="background:${p.bg}">${p.emoji}</span>
                          <span class="order-product-title">${esc(p.name)}</span>
                        </td>
                        <td style="text-align: right;" class="order-product-price">${money(p.price)}</td>
                        <td style="text-align: center;" class="order-product-qty">${i.q}</td>
                        <td style="text-align: right;" class="order-product-total">${money(p.price * i.q)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <hr style="margin: 16px 0; border: none; border-top: 1px solid var(--line);">

            <!-- Hiển thị Tổng tiền tạm tính, Giảm giá, Phí vận chuyển, Tổng thanh toán -->
            <div class="order-price-breakdown">
              <div class="row sp order-price-row">
                <span>Tổng tiền tạm tính:</span>
                <b id="orderSubtotalAmount">${money(t.sub)}</b>
              </div>

              <div class="row sp order-price-row" id="orderDiscountRow" style="display: ${t.disc > 0 ? 'flex' : 'none'}; color: var(--tea);">
                <span>Giảm giá (Voucher):</span>
                <b id="orderDiscountAmount">-${money(t.disc)}</b>
              </div>

              <div class="row sp order-price-row">
                <span>Phí vận chuyển:</span>
                <span id="orderShippingAmount">${t.ship ? money(t.ship) : '<span style="color:var(--tea);font-weight:600">Miễn phí</span>'}</span>
              </div>

              <hr style="margin: 12px 0; border: none; border-top: 1px dashed var(--line);">

              <div class="row sp order-price-total">
                <span style="font-size: 16px; font-weight: 700;">Tổng thanh toán:</span>
                <b class="price" id="orderTotalAmount" style="font-size: 20px;">${money(t.total)}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  done() {
    const o = orders.find(x => x.id === arg);
    if (!o) {
      return `
        <div class="card" style="text-align:center;padding:40px">
          <p>Không tìm thấy thông tin đơn hàng.</p>
          <button class="btn" onclick="go('home')">Về trang chủ</button>
        </div>
      `;
    }

    const isTransfer = o.payMethod === 'momo' || o.payMethod === 'bank';
    const payConfig = PAYMENT_CONFIG[o.payMethod] || PAYMENT_CONFIG.cod;

    return `
      <div class="card" style="text-align:center;padding:40px 24px;max-width:680px;margin:0 auto">
        <div style="font-size:52px;line-height:1">✅</div>
        <h2 style="margin-top:12px">Đặt hàng thành công!</h2>
        <p>Cảm ơn bạn đã tin tưởng mua sắm tại <b>GPTea Coffee Shop</b>.</p>

        <div style="background:var(--bg);border-radius:10px;padding:16px 20px;text-align:left;margin:20px 0;">
          <div class="row sp" style="margin-bottom:8px"><span>Mã đơn hàng:</span><b>#${o.id}</b></div>
          <div class="row sp" style="margin-bottom:8px"><span>Khách hàng:</span><b>${esc(o.name)} (${esc(o.phone)})</b></div>
          <div class="row sp" style="margin-bottom:8px"><span>Địa chỉ giao hàng:</span><span>${esc(o.address)}</span></div>
          <div class="row sp" style="margin-bottom:8px"><span>Hình thức thanh toán:</span><b>${esc(o.pay)}</b></div>
          <div class="row sp" style="margin-bottom:8px"><span>Thời gian đặt:</span><span>${o.time} - ${o.date}</span></div>
          <hr style="margin:10px 0;border:none;border-top:1px dashed var(--line)">
          <div class="row sp"><b style="font-size:16px">Tổng thanh toán:</b><b class="price" style="font-size:18px">${money(o.total)}</b></div>
        </div>

        ${isTransfer ? `
          <div class="payment-details-box" style="text-align:left;margin-bottom:24px;">
            <div style="font-weight:700;color:var(--tea);margin-bottom:8px;">Hướng dẫn chuyển khoản đơn hàng:</div>
            <p style="margin:4px 0;">- <b>${payConfig.accountLabel}:</b> <span class="payment-highlight">${payConfig.accountNumber}</span> (${payConfig.accountName})</p>
            <p style="margin:4px 0;">- <b>Nội dung chuyển khoản:</b> <span class="payment-highlight">${payConfig.syntaxPrefix} ${o.id}</span></p>
            <p style="margin:4px 0;">- <b>Số tiền:</b> <b class="price">${money(o.total)}</b></p>
            <p class="mute" style="margin-top:10px;font-size:12px;">Đơn hàng sẽ được chuyển sang trạng thái chuẩn bị ngay khi nhân viên kiểm tra giao dịch thành công.</p>
          </div>
        ` : `
          <p class="mute" style="margin-bottom:24px;">Nhân viên GPTea sẽ liên hệ số điện thoại <b>${esc(o.phone)}</b> để xác nhận và giao hàng sớm nhất.</p>
        `}

        <div class="row" style="justify-content:center;gap:12px">
          <button class="btn alt" onclick="go('home')">Về trang chủ</button>
          <button class="btn" onclick="go('catalog')">Tiếp tục mua sắm</button>
        </div>
      </div>
    `;
  },

  auth() {
    if (me) {
      return `
        <h2>Tài khoản của bạn</h2>
        <div class="card">
          <p>Xin chào, <b>${esc(me.name)}</b> (${me.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}).</p>
          <h3 style="margin-top:20px">Đơn hàng của bạn</h3>
          ${orderTable(orders.filter(o => o.user === me.email))}
          <br>
          <button class="btn alt" onclick="logout()">Đăng xuất</button>
        </div>
      `;
    }
    return `
      <div class="two">
        <div class="card">
          <h2>Đăng nhập</h2>
          <label>Email hoặc tài khoản</label>
          <input id="le" placeholder="admin hoặc email của bạn">
          <label>Mật khẩu</label>
          <input id="lp" type="password">
          <p id="lerr" style="color:var(--err)"></p>
          <button class="btn" onclick="login()">Đăng nhập</button>
        </div>
        <div class="card">
          <h2>Đăng ký tài khoản</h2>
          <label>Họ và tên</label>
          <input id="rn" placeholder="Nguyễn Văn A">
          <label>Email</label>
          <input id="re" type="email" placeholder="example@email.com">
          <label>Mật khẩu (từ 6 ký tự)</label>
          <input id="rp" type="password">
          <p id="rerr" style="color:var(--err)"></p>
          <button class="btn" onclick="register()">Tạo tài khoản</button>
        </div>
      </div>
    `;
  },

  admin() {
    if (me?.role !== 'admin') {
      return `
        <h2>Quản trị</h2>
        <div class="card" style="text-align:center;padding:40px;">
          <p class="mute">Chỉ quản trị viên mới xem được trang này.</p>
          <p>Đăng nhập bằng tài khoản: <b>admin</b> / mật khẩu: <b>admin</b>.</p>
          <button class="btn" onclick="go('auth')">Đến trang đăng nhập</button>
        </div>
      `;
    }
    const rev = orders.reduce((a, o) => a + o.total, 0);
    return `
      <h2>Bảng điều khiển Quản trị</h2>
      <div class="grid" style="margin-bottom:20px">
        <div class="card"><div class="mute">Tổng doanh thu</div><b style="font-size:22px;color:var(--tea)">${money(rev)}</b></div>
        <div class="card"><div class="mute">Tổng đơn hàng</div><b style="font-size:22px">${orders.length}</b></div>
        <div class="card"><div class="mute">Số lượng sản phẩm</div><b style="font-size:22px">${products.length}</b></div>
      </div>
      <h3>Thêm sản phẩm mới</h3>
      <div class="card row">
        <input id="an" placeholder="Tên sản phẩm trà" style="flex:2">
        <input id="ac" placeholder="Loại (Ô long, Trà xanh...)" style="flex:1">
        <input id="ap" type="number" placeholder="Giá tiền (₫)" style="flex:1">
        <button class="btn" onclick="addProduct()">Thêm mới</button>
      </div>
      <h3 style="margin-top:24px">Danh sách sản phẩm</h3>
      <div class="wrap">
        <table>
          <tr><th>Sản phẩm</th><th>Giá bán</th><th>Hành động</th></tr>
          ${products.map(p => `
            <tr>
              <td>${p.emoji} ${esc(p.name)} (${esc(p.cat)})</td>
              <td>${money(p.price)}</td>
              <td>
                <button class="btn alt sm" onclick="editPrice(${p.id})">Sửa giá</button>
                <button class="btn alt sm" onclick="delProduct(${p.id})">Xóa</button>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
      <h3 style="margin-top:24px">Quản lý Đơn hàng</h3>
      ${orderTable(orders, true)}
    `;
  },

  contact() {
    return `
      <h2>Liên hệ với GPTea</h2>
      <div class="two">
        <div class="card">
          <label>Họ và tên</label><input id="kn" placeholder="Họ tên của bạn">
          <label>Email</label><input id="ke" type="email" placeholder="Địa chỉ email nhận phản hồi">
          <label>Nội dung tin nhắn</label><textarea id="km" rows="4" placeholder="Nội dung cần hỗ trợ, phản hồi hoặc đặt tiệc trà..."></textarea>
          <p id="kerr" style="color:var(--err)"></p>
          <button class="btn" onclick="sendContact()">Gửi tin nhắn</button>
        </div>
        <div class="card">
          <b style="font-size:16px">Cửa hàng Trà Thủ Công GPTea</b>
          <p style="margin-top:10px;line-height:1.7;">
            📍 12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh<br>
            📞 Hotline: 0987 654 321<br>
            ✉️ Email: lienhe@gptea.example<br>
            ⏰ Giờ mở cửa: 08:00 – 22:00 tất cả các ngày
          </p>
          <div class="note" style="margin-top:16px;">
            Nhận đặt quà biếu trà cao cấp, tiệc trà teabreak doanh nghiệp.
          </div>
        </div>
      </div>
    `;
  }
};

function orderTable(l, all) {
  return l.length ? `
    <div class="wrap">
      <table>
        <tr>
          <th>Mã đơn</th>
          ${all ? '<th>Khách hàng</th>' : ''}
          <th>Ngày</th>
          <th>Phương thức</th>
          <th>Tổng tiền</th>
          <th>Trạng thái</th>
        </tr>
        ${l.map(o => `
          <tr>
            <td>#${o.id}</td>
            ${all ? `<td>${esc(o.name)}<br><span class="mute">${esc(o.phone)}</span></td>` : ''}
            <td>${o.date}</td>
            <td>${esc(o.payMethod === 'momo' ? 'MoMo' : o.payMethod === 'bank' ? 'Chuyển khoản' : 'COD')}</td>
            <td><b class="price">${money(o.total)}</b></td>
            <td>
              ${all ? `
                <select onchange="setStatus(${o.id},this.value)">
                  ${['Chờ xác nhận', 'Chờ thanh toán', 'Đang giao', 'Hoàn tất', 'Đã hủy'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              ` : `<span class="badge">${esc(o.status)}</span>`}
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '<p class="mute" style="padding:20px 0;">Chưa có đơn hàng nào.</p>';
}

/* ==========================================================================
   CHECKOUT INTERACTION LOGIC (TOGGLE ẨN/HIỆN & MÃ GIẢM GIÁ VOUCHER)
   ========================================================================== */

/**
 * Xử lý sự kiện khi người dùng chọn hình thức thanh toán (COD / MoMo / Ngân hàng)
 * - COD: Ẩn khung thông tin chuyển khoản (paymentDetailsBox)
 * - MoMo / Ngân hàng: Hiển thị khung thông tin chuyển khoản và cập nhật placeholder dữ liệu
 */
function handlePaymentMethodChange(method) {
  if (!PAYMENT_CONFIG[method]) method = 'cod';
  selectedPaymentMethod = method;

  // 1. Cập nhật trạng thái hiển thị giao diện của 3 Card lựa chọn
  document.querySelectorAll('.payment-method-card').forEach(card => card.classList.remove('selected'));
  
  const targetRadio = $(`#paymentMethod${method.charAt(0).toUpperCase() + method.slice(1)}`);
  if (targetRadio) {
    targetRadio.checked = true;
    const parentCard = targetRadio.closest('.payment-method-card');
    if (parentCard) parentCard.classList.add('selected');
  }

  // 2. Logic xử lý ẩn/hiện khung thông tin thanh toán (Payment Details Box)
  const box = $('#paymentDetailsBox');
  if (!box) return;

  if (method === 'cod') {
    // Ẩn toàn bộ khung chuyển khoản khi chọn COD
    box.style.display = 'none';
  } else {
    // Hiển thị khung thông tin thanh toán khi chọn MoMo hoặc Ngân hàng
    box.style.display = 'block';

    const config = PAYMENT_CONFIG[method];
    if (config) {
      const nextOrderId = 1000 + orders.length + 1;
      const syntax = (config.syntaxPrefix || 'GPTEA') + ' ' + nextOrderId;
      const currentTotals = totals();

      // Cập nhật tiêu đề & nhãn
      const titleEl = $('#paymentDetailsTitle');
      if (titleEl) titleEl.textContent = config.name;

      const badgeEl = $('#paymentProviderBadge');
      if (badgeEl) badgeEl.textContent = config.providerName;

      // Cập nhật ô hiển thị mã QR (placeholder)
      const qrImg = $('#paymentQrImage');
      if (qrImg) {
        qrImg.src = config.qrImage;
        qrImg.alt = 'Mã QR thanh toán ' + config.name;
      }

      // Cập nhật thông tin tài khoản (placeholder text)
      const bankNameEl = $('#paymentBankName');
      if (bankNameEl) bankNameEl.textContent = config.providerName;

      const accLabelEl = $('#paymentAccountLabel');
      if (accLabelEl) accLabelEl.textContent = config.accountLabel + ':';

      const accNumEl = $('#paymentAccountNumber');
      if (accNumEl) accNumEl.textContent = config.accountNumber;

      const accNameEl = $('#paymentAccountName');
      if (accNameEl) accNameEl.textContent = config.accountName;

      const amountEl = $('#paymentTransferAmount');
      if (amountEl) amountEl.textContent = money(currentTotals.total);

      // Cập nhật cú pháp chuyển khoản (placeholder syntax)
      const syntaxEl = $('#paymentTransferSyntax');
      if (syntaxEl) syntaxEl.textContent = syntax;

      const instructionEl = $('#paymentInstruction');
      if (instructionEl) instructionEl.textContent = config.instruction;
    }
  }
}

/**
 * Xử lý áp dụng mã giảm giá (Voucher) ngay tại trang Checkout
 * Cập nhật giao diện động mà không tải lại toàn trang để giữ nguyên thông tin đã nhập
 */
function applyCheckoutCoupon() {
  const input = $('#checkoutCouponInput');
  const msgEl = $('#checkoutCouponMsg');
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  if (!code) {
    if (msgEl) msgEl.innerHTML = '<span style="color:var(--err);font-size:13px;">Vui lòng nhập mã giảm giá.</span>';
    toast('Vui lòng nhập mã voucher');
    return;
  }

  if (!COUPONS[code]) {
    if (msgEl) msgEl.innerHTML = '<span style="color:var(--err);font-size:13px;">Mã không hợp lệ. Hãy thử TRA10, FREESHIP hoặc GPTEA20.</span>';
    toast('Mã voucher không hợp lệ');
    return;
  }

  coupon = code;
  const t = totals();

  if (msgEl) {
    msgEl.innerHTML = `
      <div class="voucher-tag-active">
        <span>Đang áp dụng: <b>${coupon}</b> (${COUPONS[coupon].txt})</span>
        <button type="button" class="voucher-remove-btn" onclick="removeCheckoutCoupon()" title="Hủy mã">&times;</button>
      </div>
    `;
  }

  updateCheckoutPriceDisplay(t);
  toast('Đã áp dụng mã ' + code);
}

/**
 * Hủy mã giảm giá tại trang Checkout
 */
function removeCheckoutCoupon() {
  coupon = null;
  const input = $('#checkoutCouponInput');
  if (input) input.value = '';

  const msgEl = $('#checkoutCouponMsg');
  if (msgEl) msgEl.innerHTML = '<span class="mute" style="font-size:13px;">Đã hủy mã giảm giá.</span>';

  const t = totals();
  updateCheckoutPriceDisplay(t);
  toast('Đã hủy mã voucher');
}

/**
 * Cập nhật các trường số tiền trên trang Checkout mượt mà
 */
function updateCheckoutPriceDisplay(t) {
  const subEl = $('#orderSubtotalAmount');
  if (subEl) subEl.textContent = money(t.sub);

  const discRow = $('#orderDiscountRow');
  const discEl = $('#orderDiscountAmount');
  if (discRow && discEl) {
    if (t.disc > 0) {
      discRow.style.display = 'flex';
      discEl.textContent = '-' + money(t.disc);
    } else {
      discRow.style.display = 'none';
    }
  }

  const shipEl = $('#orderShippingAmount');
  if (shipEl) {
    shipEl.innerHTML = t.ship ? money(t.ship) : '<span style="color:var(--tea);font-weight:600">Miễn phí</span>';
  }

  const totalEl = $('#orderTotalAmount');
  if (totalEl) totalEl.textContent = money(t.total);

  const transferAmountEl = $('#paymentTransferAmount');
  if (transferAmountEl) transferAmountEl.textContent = money(t.total);

  const placeOrderBtn = $('#placeOrderBtn');
  if (placeOrderBtn) {
    placeOrderBtn.textContent = `Hoàn tất đặt hàng (${money(t.total)})`;
  }
}

/**
 * Xử lý xác nhận đặt hàng
 */
function placeOrder() {
  const n = ($('#cn')?.value || '').trim();
  const ph = ($('#cph')?.value || '').trim();
  const a = ($('#ca')?.value || '').trim();
  const cerr = $('#cerr');

  if (!n || !/^0\d{9}$/.test(ph) || !a) {
    if (cerr) {
      cerr.textContent = 'Vui lòng nhập đầy đủ họ tên, địa chỉ nhận hàng và số điện thoại 10 số (bắt đầu bằng 0).';
    }
    toast('Vui lòng kiểm tra lại thông tin người nhận.');
    return;
  }

  const t = totals();
  const nextOrderId = 1000 + orders.length + 1;
  const payConfig = PAYMENT_CONFIG[selectedPaymentMethod] || PAYMENT_CONFIG.cod;

  const orderObj = {
    id: nextOrderId,
    user: me?.email || 'guest',
    name: n,
    phone: ph,
    address: a,
    items: [...cart],
    subtotal: t.sub,
    discount: t.disc,
    shipping: t.ship,
    total: t.total,
    coupon: coupon,
    payMethod: selectedPaymentMethod,
    pay: payConfig.name,
    status: selectedPaymentMethod === 'cod' ? 'Chờ xác nhận' : 'Chờ thanh toán',
    date: new Date().toLocaleDateString('vi-VN'),
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  };

  orders.push(orderObj);
  cart = [];
  coupon = null;
  save('orders', orders);
  save('cart', cart);
  upd();
  go('done', orderObj.id);
  toast('Đặt hàng thành công!');
}

/* ==========================================================================
   OTHER ACTIONS & CRUD
   ========================================================================== */

function list() {
  const q = $('#fq');
  const pos = q ? q.selectionStart : 0;
  render();
  const n = $('#fq');
  if (n) {
    n.focus();
    n.setSelectionRange(pos, pos);
  }
}

function addCart(id, q = 1) {
  q = Math.max(1, q || 1);
  const item = cart.find(x => x.id === id);
  item ? (item.q += q) : cart.push({ id, q });
  save('cart', cart);
  upd();
  toast('Đã thêm sản phẩm vào giỏ hàng');
}

function setQty(id, q) {
  const item = cart.find(x => x.id === id);
  if (item) {
    if (q <= 0) {
      rmCart(id);
      return;
    }
    item.q = q;
  }
  save('cart', cart);
  render();
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (item) {
    const newQty = item.q + delta;
    if (newQty <= 0) {
      rmCart(id);
    } else {
      item.q = newQty;
      save('cart', cart);
      render();
    }
  }
}

function rmCart(id) {
  cart = cart.filter(x => x.id !== id);
  save('cart', cart);
  render();
}

function toggleWish(id) {
  wish = wish.includes(id) ? wish.filter(x => x !== id) : [...wish, id];
  save('wish', wish);
  render();
}

function applyCoupon() {
  const input = $('#cp');
  if (!input) return;
  const c = input.value.trim().toUpperCase();
  if (!COUPONS[c]) {
    toast('Mã không hợp lệ. Thử TRA10, FREESHIP hoặc GPTEA20');
    return;
  }
  coupon = c;
  render();
  toast('Đã áp dụng mã ' + c);
}

function addReview(id) {
  const t = ($('#rt')?.value || '').trim();
  if (!me) {
    toast('Vui lòng đăng nhập để gửi đánh giá');
    return go('auth');
  }
  if (!t) {
    toast('Vui lòng nhập nhận xét của bạn');
    return;
  }
  (reviews[id] = reviews[id] || []).push({ u: me.name, s: +$('#rs').value, t });
  save('reviews', reviews);
  render();
  toast('Cảm ơn bạn đã gửi đánh giá');
}

function register() {
  const n = ($('#rn')?.value || '').trim();
  const e = ($('#re')?.value || '').trim().toLowerCase();
  const p = $('#rp')?.value || '';
  const rerr = $('#rerr');

  if (!n || !/^\S+@\S+\.\S+$/.test(e) || p.length < 6) {
    if (rerr) rerr.textContent = 'Vui lòng nhập tên, email hợp lệ và mật khẩu từ 6 ký tự.';
    return;
  }
  if (users.some(u => u.email === e)) {
    if (rerr) rerr.textContent = 'Email này đã tồn tại trên hệ thống.';
    return;
  }
  const u = { name: n, email: e, pw: p, role: 'user' };
  users.push(u);
  save('users', users);
  setMe(u);
}

function login() {
  const e = ($('#le')?.value || '').trim().toLowerCase();
  const p = $('#lp')?.value || '';
  const lerr = $('#lerr');

  const u = (e === 'admin' && p === 'admin')
    ? { name: 'Quản trị viên', email: 'admin', role: 'admin' }
    : users.find(x => x.email === e && x.pw === p);

  if (!u) {
    if (lerr) lerr.textContent = 'Sai thông tin đăng nhập. Thử lại hoặc dùng admin/admin.';
    return;
  }
  setMe(u);
}

function setMe(u) {
  me = { name: u.name, email: u.email, role: u.role };
  save('me', me);
  upd();
  toast('Xin chào ' + me.name);
  go(me.role === 'admin' ? 'admin' : 'home');
}

function logout() {
  me = null;
  save('me', null);
  upd();
  go('home');
  toast('Đã đăng xuất tài khoản');
}

function addProduct() {
  const n = ($('#an')?.value || '').trim();
  const c = ($('#ac')?.value || '').trim() || 'Trà khác';
  const p = +($('#ap')?.value || 0);

  if (!n || p <= 0) {
    toast('Nhập tên và giá sản phẩm lớn hơn 0');
    return;
  }
  products.push({ id: Date.now(), name: n, cat: c, price: p, emoji: '🍃', bg: '#d6e7dc', desc: 'Mẻ trà hảo hạng mới về.' });
  save('products', products);
  render();
  toast('Đã thêm sản phẩm mới');
}

function delProduct(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
  products = products.filter(p => p.id !== id);
  cart = cart.filter(i => i.id !== id);
  save('products', products);
  save('cart', cart);
  upd();
  render();
  toast('Đã xóa sản phẩm');
}

function editPrice(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const v = +prompt('Nhập giá mới (₫):', p.price);
  if (v > 0) {
    p.price = v;
    save('products', products);
    render();
    toast('Đã cập nhật giá mới');
  }
}

function setStatus(id, s) {
  const o = orders.find(x => x.id === id);
  if (o) {
    o.status = s;
    save('orders', orders);
    toast('Đã cập nhật trạng thái đơn #' + id);
  }
}

function sendContact() {
  const kn = ($('#kn')?.value || '').trim();
  const ke = ($('#ke')?.value || '').trim();
  const km = ($('#km')?.value || '').trim();
  const kerr = $('#kerr');

  if (!kn || !/^\S+@\S+\.\S+$/.test(ke) || !km) {
    if (kerr) kerr.textContent = 'Vui lòng nhập họ tên, email hợp lệ và nội dung.';
    return;
  }
  toast('Đã gửi phản hồi thành công! GPTea sẽ sớm liên hệ lại với bạn.');
  go('home');
}

/* ==========================================================================
   CART HOVER DROPDOWN & POPUP MODAL
   ========================================================================== */

function initCartDropdown() {
  const ccSpan = $('#cc');
  if (!ccSpan) return;
  const cartBtn = ccSpan.closest('button');
  if (!cartBtn) return;

  if (!cartBtn.parentElement.classList.contains('cart-wrapper')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cart-wrapper';
    cartBtn.parentNode.insertBefore(wrapper, cartBtn);
    wrapper.appendChild(cartBtn);

    const dropdown = document.createElement('div');
    dropdown.className = 'cart-dropdown';
    dropdown.id = 'cartPreview';
    wrapper.appendChild(dropdown);

    // Mở popup modal khi bấm vào nút Giỏ hàng
    cartBtn.removeAttribute('onclick');
    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartModal();
    });
  }

  renderCartPreview();
}

function renderCartPreview() {
  const preview = $('#cartPreview');
  if (!preview) return;

  if (!cart.length) {
    preview.innerHTML = '<p class="mute" style="text-align:center;margin:12px 0;">Giỏ hàng của bạn đang trống.</p>';
    return;
  }

  const t = totals();
  const firstTwo = cart.slice(0, 2);
  const remaining = cart.length - 2;
  const totalQty = cart.reduce((a, i) => a + i.q, 0);

  let html = '';
  firstTwo.forEach(i => {
    const p = products.find(x => x.id === i.id);
    if (p) {
      html += `
        <div class="cart-dropdown-item">
          <div class="cd-emoji" style="background:${p.bg}">${p.emoji}</div>
          <div class="cd-info">
            <div class="cd-name">${esc(p.name)}</div>
            <div class="cd-price-row">
              <span>${i.q} x ${money(p.price)}</span>
              <b class="price">${money(p.price * i.q)}</b>
            </div>
          </div>
        </div>
      `;
    }
  });

  if (remaining > 0) {
    html += `<div class="mute" style="text-align:center; font-size: 13px; margin: 4px 0 12px;">...và ${remaining} sản phẩm khác</div>`;
  }

  html += `
    <div class="cart-dropdown-footer">
      <div class="cd-total-row">
        <span>Tổng (${totalQty} món)</span>
        <b class="price" style="font-size:16px">${money(t.total)}</b>
      </div>
      <button class="btn" style="width: 100%; margin-top: 12px;" onclick="openCartModal()">Xem giỏ hàng chi tiết</button>
    </div>
  `;

  preview.innerHTML = html;
}

function openCartModal() {
  let overlay = $('#cartModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cartModalOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="cart-modal" onclick="event.stopPropagation()">
        <div class="cart-modal-header">
          <h3>Giỏ hàng của bạn</h3>
          <button class="cart-modal-close" onclick="closeCartModal()" aria-label="Đóng">&times;</button>
        </div>
        <div class="cart-modal-body" id="cartModalBody"></div>
        <div class="cart-modal-footer" id="cartModalFooter"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', closeCartModal);
  }

  renderCartModalContent();
  setTimeout(() => overlay.classList.add('active'), 10);
}

function closeCartModal() {
  const overlay = $('#cartModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

function renderCartModalContent() {
  const body = $('#cartModalBody');
  const footer = $('#cartModalFooter');
  if (!body || !footer) return;

  if (cart.length === 0) {
    body.innerHTML = '<div class="cart-modal-empty">Chưa có sản phẩm nào trong giỏ hàng.</div>';
    footer.style.display = 'none';
  } else {
    footer.style.display = 'block';
    let html = '<div class="wrap"><table class="cart-modal-table"><tr><th>Sản phẩm</th><th>SL</th><th>Giá</th><th></th></tr>';
    cart.forEach(i => {
      const p = products.find(x => x.id === i.id);
      if (p) {
        html += `
          <tr>
            <td>
              <div class="row" style="flex-wrap: nowrap; gap: 8px;">
                 <div class="cd-emoji" style="background:${p.bg}; width: 36px; height: 36px; font-size: 18px; border-radius:6px; display:flex; align-items:center; justify-content:center;">${p.emoji}</div>
                 <span style="font-weight: 500; font-size: 14px;">${esc(p.name)}</span>
              </div>
            </td>
            <td>
              <div class="row" style="flex-wrap: nowrap; gap: 4px; align-items: center;">
                <button type="button" class="btn alt sm" style="padding: 2px 7px; min-width: 24px;" onclick="changeQty(${i.id}, -1)">-</button>
                <input type="number" min="1" value="${i.q}" style="width: 48px; padding: 4px; text-align: center;" onchange="setQtyModal(${i.id}, +this.value)">
                <button type="button" class="btn alt sm" style="padding: 2px 7px; min-width: 24px;" onclick="changeQty(${i.id}, 1)">+</button>
              </div>
            </td>
            <td><b class="price">${money(p.price * i.q)}</b></td>
            <td><button class="btn alt sm" onclick="rmCartModal(${i.id})">Xóa</button></td>
          </tr>
        `;
      }
    });
    html += '</table></div>';
    body.innerHTML = html;

    const t = totals();
    footer.innerHTML = `
      <div class="row sp" style="margin-bottom: 12px; font-size: 16px;">
        <b>Tổng cộng:</b> <b class="price" style="font-size:18px">${money(t.total)}</b>
      </div>
      <div class="row" style="gap: 8px;">
        <button class="btn alt" style="flex: 1;" onclick="closeCartModal(); go('cart')">Xem giỏ hàng</button>
        <button class="btn" style="flex: 1.5;" onclick="closeCartModal(); go('checkout')">Thanh toán ngay</button>
      </div>
    `;
  }
}

function setQtyModal(id, q) {
  setQty(id, q);
}

function rmCartModal(id) {
  rmCart(id);
}

/* ==========================================================================
   RENDER & UPDATE SYSTEM
   ========================================================================== */

function upd() {
  const cc = $('#cc');
  if (cc) cc.textContent = cart.reduce((a, i) => a + i.q, 0);

  const authBtn = $('#authBtn');
  if (authBtn) authBtn.textContent = me ? '👤 ' + me.name : 'Đăng nhập';

  const adminBtn = $('#adminBtn');
  if (adminBtn) adminBtn.hidden = me?.role !== 'admin';

  // Cập nhật Hover Preview
  const wrapper = document.querySelector('.cart-wrapper');
  if (!wrapper) {
    initCartDropdown();
  } else {
    renderCartPreview();
  }

  // Cập nhật Modal nếu đang mở
  const overlay = $('#cartModalOverlay');
  if (overlay && overlay.classList.contains('active')) {
    renderCartModalContent();
  }
}

function render() {
  const app = $('#app');
  if (!app) return;
  app.innerHTML = V[view]();
  upd();
  document.querySelectorAll('header button[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === view));
}

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    render();
  });
} else {
  render();
}
