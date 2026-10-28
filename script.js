const $ = (s) => document.querySelector(s);
const money = (n) => n.toLocaleString('vi-VN') + '₫';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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

const SEED = [
  { id: 1, name: 'Trà ô long Thái Nguyên', cat: 'Ô long', price: 180000, emoji: '🍵', bg: '#cfe6d8', desc: 'Hương hoa nhẹ, hậu vị ngọt, sao lửa vừa.' },
  { id: 2, name: 'Trà xanh Tân Cương', cat: 'Trà xanh', price: 120000, emoji: '🌿', bg: '#d9ecc9', desc: 'Búp non, nước xanh sáng, vị chát dịu.' },
  { id: 3, name: 'Trà shan tuyết Hà Giang', cat: 'Trà cổ thụ', price: 350000, emoji: '🏔️', bg: '#dfe8ef', desc: 'Cây cổ thụ trên 200 năm tuổi, vị đậm sâu.' },
  { id: 4, name: 'Hồng trà Mộc Châu', cat: 'Hồng trà', price: 150000, emoji: '🍂', bg: '#f1d9c4', desc: 'Men nhẹ, thơm mật ong, hợp uống với sữa.' },
  { id: 5, name: 'Trà sen Tây Hồ', cat: 'Trà hương', price: 420000, emoji: '🪷', bg: '#f3dbe5', desc: 'Ướp thủ công từ hoa sen buổi sớm.' },
  { id: 6, name: 'Trà sen Tây Hồ', cat: 'Trà hương', price: 420000, emoji: '🪷', bg: '#f3dbe5', desc: 'Ướp thủ công từ hoa sen buổi sớm.' },
  { id: 7, name: 'Trà sen Tây Hồ', cat: 'Trà hương', price: 420000, emoji: '🪷', bg: '#f3dbe5', desc: 'Ướp thủ công từ hoa sen buổi sớm.' },
  { id: 8, name: 'Trà sen Tây Hồ', cat: 'Trà hương', price: 420000, emoji: '🪷', bg: '#f3dbe5', desc: 'Ướp thủ công từ hoa sen buổi sớm.' },
  { id: 9, name: 'Trà sen Tây Hồ', cat: 'Trà hương', price: 420000, emoji: '🪷', bg: '#f3dbe5', desc: 'Ướp thủ công từ hoa sen buổi sớm.' },
  { id: 10, name: 'Trà sen Tây Hồ', cat: 'Trà hương', price: 420000, emoji: '🪷', bg: '#f3dbe5', desc: 'Ướp thủ công từ hoa sen buổi sớm.' },
  { id: 11, name: 'Trà sen Tây Hồ', cat: 'Trà hương', price: 420000, emoji: '🪷', bg: '#f3dbe5', desc: 'Ướp thủ công từ hoa sen buổi sớm.' },
  { id: 12, name: 'Trà sen Tây Hồ', cat: 'Trà hương', price: 420000, emoji: '🪷', bg: '#f3dbe5', desc: 'Ướp thủ công từ hoa sen buổi sớm.' },
  { id: 13, name: 'Trà sen Tây Hồ', cat: 'Trà hương', price: 420000, emoji: '🪷', bg: '#f3dbe5', desc: 'Ướp thủ công từ hoa sen buổi sớm.' },
  { id: 14, name: 'Trà sen Tây Hồ', cat: 'Trà hương', price: 420000, emoji: '🪷', bg: '#f3dbe5', desc: 'Ướp thủ công từ hoa sen buổi sớm.' },
  { id: 15, name: 'Trà sen Tây Hồ', cat: 'Trà hương', price: 420000, emoji: '🪷', bg: '#f3dbe5', desc: 'Ướp thủ công từ hoa sen buổi sớm.' },
  { id: 16, name: 'Trà atiso đỏ khô', cat: 'Trà thảo mộc', price: 90000, emoji: '🌺', bg: '#f2cfd0', desc: 'Chua nhẹ, màu đỏ ruby, không caffeine.' }
];

let products = load('products', SEED),
    cart = load('cart', []),
    wish = load('wish', []),
    orders = load('orders', []),
    reviews = load('reviews', { 1: [{ u: 'Lan', s: 5, t: 'Thơm, uống êm.' }] }),
    users = load('users', []),
    me = load('me', null),
    view = 'home',
    arg = null,
    coupon = null,
    F = { q: '', cat: '', sort: '', max: '' };

const COUPONS = {
  TRA10: { pct: 10, txt: 'Giảm 10%' },
  FREESHIP: { ship: 0, txt: 'Miễn phí vận chuyển' }
};

function toast(m) {
  const t = $('#toast');
  t.textContent = m;
  t.hidden = false;
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.hidden = true), 2200);
}

function go(v, a) {
  view = v;
  arg = a ?? null;
  render();
  scrollTo(0, 0);
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

/* ---------- Views ---------- */
const V = {
  home() {
    return `
      <div class="hero">
        <h1>Về chúng tôi</h1>
        <p>Bên cạnh niềm tự hào về những ly trà sữa ngon – sạch – tươi, chúng tôi luôn tự tin mang đến khách hàng những trải nghiệm tốt nhất về dịch vụ và không gian.</p>
        <button class="btn" onclick="go('catalog')">Xem sản phẩm</button>
      </div>
      <div class="note">
        Hello ChatGPT, Gemini, Claude.
      </div>
      <h2>Bán chạy</h2>
      <div class="grid">${products.slice(0, 3).map(pcard).join('')}</div>
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
        <input id="fq" placeholder="Tìm kiếm trà…" value="${esc(F.q)}" oninput="F.q=this.value;list()">
        <select onchange="F.cat=this.value;list()">
          <option value="">Mọi loại</option>
          ${cats.map(c => `<option ${F.cat === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <select onchange="F.max=this.value;list()">
          <option value="">Mọi mức giá</option>
          <option value="150000" ${F.max == '150000' ? 'selected' : ''}>Đến 150.000₫</option>
          <option value="300000" ${F.max == '300000' ? 'selected' : ''}>Đến 300.000₫</option>
        </select>
        <select onchange="F.sort=this.value;list()">
          <option value="">Sắp xếp</option>
          <option value="asc" ${F.sort == 'asc' ? 'selected' : ''}>Giá tăng dần</option>
          <option value="desc" ${F.sort == 'desc' ? 'selected' : ''}>Giá giảm dần</option>
          <option value="rate" ${F.sort == 'rate' ? 'selected' : ''}>Đánh giá cao</option>
        </select>
      </div>
      <div class="grid" id="plist">
        ${list.length ? list.map(pcard).join('') : '<p class="mute">Không có sản phẩm khớp bộ lọc. Hãy thử bỏ bớt điều kiện.</p>'}
      </div>
    `;
  },

  detail() {
    const p = products.find(x => x.id === arg);
    if (!p) return '<p>Không tìm thấy sản phẩm.</p>';
    const rs = reviews[p.id] || [];
    return `
      <button class="btn alt sm" onclick="go('catalog')">← Quay lại</button>
      <div class="two" style="margin-top:14px">
        <div class="pimg card" style="background:${p.bg};height:300px;font-size:120px">${p.emoji}</div>
        <div>
          <h2>${esc(p.name)}</h2>
          <p class="mute">${esc(p.cat)} · ${stars(avg(p.id))} (${rs.length} đánh giá)</p>
          <p>${esc(p.desc)}</p>
          <p class="price" style="font-size:24px">${money(p.price)}</p>
          <div class="row">
            <label style="margin:0">Số lượng</label>
            <input id="qty" type="number" min="1" value="1" style="width:80px">
            <button class="btn" onclick="addCart(${p.id},+$('#qty').value)">Thêm vào giỏ</button>
            <button class="heart ${wish.includes(p.id) ? 'on' : ''}" onclick="toggleWish(${p.id})">♥</button>
          </div>
        </div>
      </div>
      <h3 style="margin-top:28px">Đánh giá</h3>
      ${rs.map(r => `<div class="card" style="margin-bottom:8px"><b>${esc(r.u)}</b> ${stars(r.s)}<br>${esc(r.t)}</div>`).join('') || '<p class="mute">Chưa có đánh giá. Hãy là người đầu tiên.</p>'}
      <div class="card" style="margin-top:12px">
        <label>Điểm</label>
        <select id="rs"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select>
        <label>Nhận xét</label>
        <textarea id="rt" rows="2"></textarea>
        <br><br>
        <button class="btn" onclick="addReview(${p.id})">Gửi đánh giá</button>
      </div>
    `;
  },

  wish() {
    const l = products.filter(p => wish.includes(p.id));
    return `
      <h2>Sản phẩm yêu thích</h2>
      ${l.length ? `<div class="grid">${l.map(pcard).join('')}</div>` : '<p class="mute">Bạn chưa lưu sản phẩm nào. Bấm ♥ trên sản phẩm để lưu.</p>'}
    `;
  },

  cart() {
    if (!cart.length) {
      return `
        <h2>Giỏ hàng</h2>
        <p class="mute">Giỏ hàng đang trống.</p>
        <button class="btn" onclick="go('catalog')">Chọn sản phẩm</button>
      `;
    }
    const t = totals();
    return `
      <h2>Giỏ hàng</h2>
      <div class="wrap">
        <table>
          <tr><th>Sản phẩm</th><th>Giá</th><th>SL</th><th>Thành tiền</th><th></th></tr>
          ${cart.map(i => {
            const p = products.find(x => x.id === i.id);
            return p ? `
              <tr>
                <td>${p.emoji} ${esc(p.name)}</td>
                <td>${money(p.price)}</td>
                <td><input type="number" min="1" value="${i.q}" style="width:70px" onchange="setQty(${i.id},+this.value)"></td>
                <td>${money(p.price * i.q)}</td>
                <td><button class="btn alt sm" onclick="rmCart(${i.id})">Xóa</button></td>
              </tr>
            ` : '';
          }).join('')}
        </table>
      </div>
      <div class="two" style="margin-top:20px">
        <div class="card">
          <b>Mã giảm giá</b>
          <div class="row" style="margin-top:8px">
            <input id="cp" placeholder="Thử TRA10 hoặc FREESHIP" style="flex:1">
            <button class="btn" onclick="applyCoupon()">Áp dụng</button>
          </div>
          <p class="mute">${coupon ? 'Đang dùng: ' + coupon + ' – ' + COUPONS[coupon].txt : ''}</p>
        </div>
        <div class="card">
          ${sumHtml(t)}
          <br>
          <button class="btn" onclick="go('checkout')">Thanh toán</button>
        </div>
      </div>
    `;
  },

  checkout() {
    if (!cart.length) return '<p>Giỏ hàng trống.</p>';
    const t = totals();
    return `
      <h2>Thanh toán</h2>
      <div class="two">
        <div class="card">
          <label>Họ tên</label>
          <input id="cn" value="${esc(me?.name || '')}">
          <label>Số điện thoại</label>
          <input id="cph">
          <label>Địa chỉ giao hàng</label>
          <textarea id="ca" rows="2"></textarea>
          <label>Phương thức</label>
          <select id="cm">
            <option>Thanh toán khi nhận hàng (COD)</option>
            <option>Chuyển khoản ngân hàng</option>
            <option>Ví điện tử (mô phỏng)</option>
          </select>
          <p id="cerr" style="color:var(--err)"></p>
          <button class="btn" onclick="placeOrder()">Đặt hàng</button>
        </div>
        <div class="card">${sumHtml(t)}</div>
      </div>
    `;
  },

  done() {
    const o = orders.find(x => x.id === arg);
    return `
      <div class="card" style="text-align:center;padding:40px">
        <div style="font-size:50px">✅</div>
        <h2>Đặt hàng thành công</h2>
        <p>Mã đơn <b>#${o.id}</b> · Tổng ${money(o.total)}<br><span class="mute">Chúng tôi sẽ liên hệ ${esc(o.phone)} để xác nhận.</span></p>
        <button class="btn" onclick="go('home')">Về trang chủ</button>
      </div>
    `;
  },

  auth() {
    if (me) {
      return `
        <h2>Tài khoản</h2>
        <div class="card">
          <p>Xin chào, <b>${esc(me.name)}</b> (${me.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}).</p>
          <h3>Đơn hàng của bạn</h3>
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
          <label>Email / tên đăng nhập</label>
          <input id="le">
          <label>Mật khẩu</label>
          <input id="lp" type="password">
          <p id="lerr" style="color:var(--err)"></p>
          <button class="btn" onclick="login()">Đăng nhập</button>
        </div>
        <div class="card">
          <h2>Đăng ký</h2>
          <label>Họ tên</label>
          <input id="rn">
          <label>Email</label>
          <input id="re" type="email">
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
        <p class="mute">Chỉ quản trị viên mới xem được trang này. Đăng nhập bằng admin / admin.</p>
      `;
    }
    const rev = orders.reduce((a, o) => a + o.total, 0);
    return `
      <h2>Quản trị</h2>
      <div class="grid" style="margin-bottom:20px">
        <div class="card"><div class="mute">Doanh thu</div><b style="font-size:22px">${money(rev)}</b></div>
        <div class="card"><div class="mute">Đơn hàng</div><b style="font-size:22px">${orders.length}</b></div>
        <div class="card"><div class="mute">Sản phẩm</div><b style="font-size:22px">${products.length}</b></div>
      </div>
      <h3>Thêm sản phẩm</h3>
      <div class="card row">
        <input id="an" placeholder="Tên" style="flex:2">
        <input id="ac" placeholder="Loại" style="flex:1">
        <input id="ap" type="number" placeholder="Giá" style="flex:1">
        <button class="btn" onclick="addProduct()">Thêm</button>
      </div>
      <h3 style="margin-top:20px">Sản phẩm</h3>
      <div class="wrap">
        <table>
          ${products.map(p => `
            <tr>
              <td>${p.emoji} ${esc(p.name)}</td>
              <td>${money(p.price)}</td>
              <td>
                <button class="btn alt sm" onclick="editPrice(${p.id})">Sửa giá</button>
                <button class="btn alt sm" onclick="delProduct(${p.id})">Xóa</button>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
      <h3 style="margin-top:20px">Đơn hàng</h3>
      ${orderTable(orders, true)}
    `;
  },

  contact() {
    return `
      <h2>Liên hệ</h2>
      <div class="two">
        <div class="card">
          <label>Họ tên</label><input id="kn">
          <label>Email</label><input id="ke" type="email">
          <label>Nội dung</label><textarea id="km" rows="4"></textarea>
          <p id="kerr" style="color:var(--err)"></p>
          <button class="btn" onclick="sendContact()">Gửi liên hệ</button>
        </div>
        <div class="card">
          <b>Cửa hàng Trà Sương</b>
          <p>12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh<br>Hotline: 0900 000 000<br>Email: xin-chao@trasuong.example<br>Giờ mở cửa: 8:00 – 21:00 mỗi ngày</p>
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
          <th>Mã</th>
          ${all ? '<th>Khách</th>' : ''}
          <th>Ngày</th>
          <th>Tổng</th>
          <th>Trạng thái</th>
        </tr>
        ${l.map(o => `
          <tr>
            <td>#${o.id}</td>
            ${all ? `<td>${esc(o.name)}</td>` : ''}
            <td>${o.date}</td>
            <td>${money(o.total)}</td>
            <td>
              ${all ? `<select onchange="setStatus(${o.id},this.value)">${['Chờ xử lý', 'Đang giao', 'Hoàn tất'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>` : o.status}
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '<p class="mute">Chưa có đơn hàng.</p>';
}

/* ---------- Logic ---------- */
function totals() {
  const sub = cart.reduce((a, i) => {
    const p = products.find(x => x.id === i.id);
    return a + (p ? p.price * i.q : 0);
  }, 0);
  const disc = coupon && COUPONS[coupon].pct ? Math.round(sub * COUPONS[coupon].pct / 100) : 0;
  const ship = sub === 0 || sub >= 500000 || (coupon && COUPONS[coupon].ship === 0) ? 0 : 30000;
  return { sub, disc, ship, total: sub - disc + ship };
}

function sumHtml(t) {
  return `
    <div class="row sp"><span>Tạm tính</span><span>${money(t.sub)}</span></div>
    <div class="row sp"><span>Giảm giá</span><span>-${money(t.disc)}</span></div>
    <div class="row sp"><span>Vận chuyển</span><span>${t.ship ? money(t.ship) : 'Miễn phí'}</span></div>
    <hr>
    <div class="row sp"><b>Tổng cộng</b><b class="price">${money(t.total)}</b></div>
  `;
}

function list() {
  const el = $('#plist');
  const q = $('#fq');
  const pos = q.selectionStart;
  render();
  const n = $('#fq');
  n.focus();
  n.setSelectionRange(pos, pos);
}

function addCart(id, q = 1) {
  q = Math.max(1, q || 1);
  const i = cart.find(x => x.id === id);
  i ? i.q += q : cart.push({ id, q });
  save('cart', cart);
  upd();
  toast('Đã thêm vào giỏ hàng');
}

function setQty(id, q) {
  const i = cart.find(x => x.id === id);
  if (i) i.q = Math.max(1, q || 1);
  save('cart', cart);
  render();
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
  const c = $('#cp').value.trim().toUpperCase();
  if (!COUPONS[c]) {
    toast('Mã không hợp lệ. Thử TRA10 hoặc FREESHIP');
    return;
  }
  coupon = c;
  render();
  toast('Đã áp dụng mã ' + c);
}

function addReview(id) {
  const t = $('#rt').value.trim();
  if (!me) {
    toast('Hãy đăng nhập để đánh giá');
    return go('auth');
  }
  if (!t) {
    toast('Hãy nhập nhận xét');
    return;
  }
  (reviews[id] = reviews[id] || []).push({ u: me.name, s: +$('#rs').value, t });
  save('reviews', reviews);
  render();
  toast('Đã gửi đánh giá');
}

function placeOrder() {
  const n = $('#cn').value.trim(),
        ph = $('#cph').value.trim(),
        a = $('#ca').value.trim();
  if (!n || !/^0\d{9}$/.test(ph) || !a) {
    $('#cerr').textContent = 'Nhập đủ họ tên, địa chỉ và số điện thoại 10 số (bắt đầu bằng 0).';
    return;
  }
  const t = totals(),
        o = {
          id: 1000 + orders.length + 1,
          user: me?.email || 'guest',
          name: n,
          phone: ph,
          total: t.total,
          status: 'Chờ xử lý',
          date: new Date().toLocaleDateString('vi-VN'),
          pay: $('#cm').value
        };
  orders.push(o);
  cart = [];
  coupon = null;
  save('orders', orders);
  save('cart', cart);
  upd();
  go('done', o.id);
}

function register() {
  const n = $('#rn').value.trim(),
        e = $('#re').value.trim().toLowerCase(),
        p = $('#rp').value;
  if (!n || !/^\S+@\S+\.\S+$/.test(e) || p.length < 6) {
    $('#rerr').textContent = 'Nhập tên, email hợp lệ và mật khẩu từ 6 ký tự.';
    return;
  }
  if (users.some(u => u.email === e)) {
    $('#rerr').textContent = 'Email này đã được đăng ký.';
    return;
  }
  const u = { name: n, email: e, pw: p, role: 'user' };
  users.push(u);
  save('users', users);
  setMe(u);
}

function login() {
  const e = $('#le').value.trim().toLowerCase(),
        p = $('#lp').value;
  const u = (e === 'admin' && p === 'admin') ? { name: 'Quản trị viên', email: 'admin', role: 'admin' } : users.find(x => x.email === e && x.pw === p);
  if (!u) {
    $('#lerr').textContent = 'Sai thông tin đăng nhập. Kiểm tra lại email và mật khẩu.';
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
}

function addProduct() {
  const n = $('#an').value.trim(),
        c = $('#ac').value.trim() || 'Khác',
        p = +$('#ap').value;
  if (!n || p <= 0) {
    toast('Nhập tên và giá lớn hơn 0');
    return;
  }
  products.push({ id: Date.now(), name: n, cat: c, price: p, emoji: '🍃', bg: '#d6e7dc', desc: 'Sản phẩm mới.' });
  save('products', products);
  render();
  toast('Đã thêm sản phẩm');
}

function delProduct(id) {
  products = products.filter(p => p.id !== id);
  cart = cart.filter(i => i.id !== id);
  save('products', products);
  save('cart', cart);
  upd();
  render();
}

function editPrice(id) {
  const p = products.find(x => x.id === id),
        v = +prompt('Giá mới (₫):', p.price);
  if (v > 0) {
    p.price = v;
    save('products', products);
    render();
  }
}

function setStatus(id, s) {
  orders.find(o => o.id === id).status = s;
  save('orders', orders);
  toast('Đã cập nhật trạng thái');
}

function sendContact() {
  if (!$('#kn').value.trim() || !/^\S+@\S+\.\S+$/.test($('#ke').value) || !$('#km').value.trim()) {
    $('#kerr').textContent = 'Nhập họ tên, email hợp lệ và nội dung.';
    return;
  }
  toast('Đã gửi liên hệ. Chúng tôi sẽ phản hồi sớm');
  go('home');
}

function upd() {
  $('#cc').textContent = cart.reduce((a, i) => a + i.q, 0);
  $('#authBtn').textContent = me ? '👤 ' + me.name : 'Đăng nhập';
  $('#adminBtn').hidden = me?.role !== 'admin';
}

function render() {
  $('#app').innerHTML = V[view]();
  upd();
  document.querySelectorAll('header button[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === view));
}

render();