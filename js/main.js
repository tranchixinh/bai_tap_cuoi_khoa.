/* ===== main.js: navbar, footer, trang chủ/chuyên mục, trang chi tiết ===== */
function renderHeader(activeId){
  const items = getMenu().filter(m => m.type !== "external").map(m => {
    const href = m.id === "home" ? "index.html" : urlCategory(m.id);
    const sub = (m.children || []).length
      ? `<ul class="sub">${m.children.map(c => `<li><a href="${urlCategory(m.id)}">${esc(c.title)}</a></li>`).join("")}</ul>` : "";
    return `<li><a href="${href}" class="${activeId === m.id ? "active" : ""}">${esc(m.title)}</a>${sub}</li>`;
  }).join("");
  document.getElementById("header").innerHTML = `<div class="container">
    <a class="logo" href="index.html">Tin Tức 24h</a>
    <a class="crawl-link" href="crawler.html">Crawler</a>
    <button class="menu-btn" id="menuBtn" aria-label="Menu">☰</button>
    <ul class="nav" id="nav">${items}</ul></div>`;
  document.getElementById("menuBtn").onclick = () => document.getElementById("nav").classList.toggle("open");
}

function renderFooter(){
  const cats = getCategories().map(c => `<li><a href="${urlCategory(c.id)}">${esc(c.title)}</a></li>`).join("");
  const svg = {
    fb:'<svg viewBox="0 0 24 24"><path d="M13.5 21v-7.5H16l.5-3h-3V8.6c0-.9.3-1.5 1.6-1.5H16.6V4.4C16.3 4.4 15.4 4.3 14.4 4.3c-2.2 0-3.7 1.3-3.7 3.8v2.4H8.2v3h2.5V21h2.8z"/></svg>',
    yt:'<svg viewBox="0 0 24 24"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z"/></svg>',
    tt:'<svg viewBox="0 0 24 24"><path d="M16.6 3h-2.9v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.9a5.6 5.6 0 1 0 4.7 5.5V9.2a7 7 0 0 0 4 1.3V7.6a4.1 4.1 0 0 1-4-4.6z"/></svg>'
  };
  document.getElementById("footer").innerHTML = `<div class="container"><div class="cols">
    <div><h4>Tin Tức 24h</h4><p>Trang tin tức tổng hợp, cập nhật nhanh các sự kiện trong nước và quốc tế. Dự án bài tập lớn xây dựng web tin tức.</p><p style="margin-top:8px">Môn: Xây dựng web</p><p>Sinh viên thực hiện: <b>Trần Kim Chi</b></p><p>Mã SV: <b>24103163</b></p></div>
    <div><h4>Liên kết nhanh</h4><ul><li><a href="index.html">Trang chủ</a></li><li><a href="index.html?cat=latest">Tin mới</a></li><li><a href="crawler.html">Crawler</a></li><li><a href="mailto:contact@tintuc24h.vn">Liên hệ</a></li></ul></div>
    <div><h4>Chuyên mục</h4><ul class="cat-list">${cats}</ul></div>
    <div><h4>Liên hệ</h4><p>Email: contact@tintuc24h.vn</p><p>Địa chỉ: Hà Nội, Việt Nam</p>
      <div class="social"><a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook">${svg.fb}</a><a href="https://youtube.com" target="_blank" rel="noopener" aria-label="YouTube">${svg.yt}</a><a href="https://tiktok.com" target="_blank" rel="noopener" aria-label="TikTok">${svg.tt}</a></div></div>
  </div><div class="copy">© ${new Date().getFullYear()} Tin Tức 24h - Trần Kim Chi (24103163). Nguồn tin: dantri.com.vn (dùng cho mục đích học tập).</div></div>`;
}

/* ---------- Các khối hiển thị bài viết ---------- */
const imgTag = (p, cls="") => p.image ? `<img ${cls?`class="${cls}" `:""}referrerpolicy="no-referrer" src="${esc(p.image)}" alt="" loading="lazy" onerror="this.style.display='none'">` : "";
function cardBig(p){ return `<a class="card featured" href="${urlPost(p)}">${imgTag(p)}<span class="tag">${esc(p.category)}</span><h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p></a>`; }
function cardSmall(p){ return `<a class="card" href="${urlPost(p)}">${imgTag(p)}<h3>${esc(p.title)}</h3><span class="meta">${esc(p.publishedAt)}</span></a>`; }
function item(p){ return `<a class="item" href="${urlPost(p)}">${imgTag(p)}<div><span class="tag">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><span class="meta">${esc(p.publishedAt)}${p.author ? " · " + esc(p.author) : ""}</span></div></a>`; }

// 3 bài đầu (1 lớn + 2 nhỏ) + phần còn lại dạng danh sách dọc
function listLayout(posts){
  if (!posts.length) return '<div class="empty">Chưa có bài viết.</div>';
  const top = posts.slice(0,3), rest = posts.slice(3);
  return `<div class="top">${cardBig(top[0])}<div class="side">${top.slice(1).map(cardSmall).join("")}</div></div>
          ${rest.length ? `<div class="list">${rest.map(item).join("")}</div>` : ""}`;
}

/* ---------- Trang chủ / chuyên mục (index.html) ---------- */
function homePage(){
  const app = document.getElementById("app");
  const catId = new URLSearchParams(location.search).get("cat");

  if (catId){                                   // đang xem 1 chuyên mục
    const isLatest = catId === "latest";
    const cat = getMenu().find(m => m.id === catId);
    const title = isLatest ? "Tin mới nhất" : (cat ? cat.title : "Chuyên mục");
    const posts = isLatest ? sortNewest(getPosts()).slice(0,30) : postsOfCategory(catId);
    document.title = title + " - Tin Tức 24h";
    renderHeader(catId);
    app.innerHTML = `<h1 class="page-title">${esc(title)}</h1>` + listLayout(posts);
    return;
  }
  // Trang chủ: tin mới nhất + mỗi chuyên mục 3 bài
  renderHeader("home");
  app.innerHTML = `<h1 class="page-title">Tin mới nhất</h1>` + listLayout(sortNewest(getPosts()).slice(0,10));
  getCategories().forEach(c => {
    const ps = postsOfCategory(c.id).slice(0,3);
    if (!ps.length) return;
    app.insertAdjacentHTML("beforeend",
      `<h2 class="section-h" style="margin-top:32px"><a href="${urlCategory(c.id)}" class="tag" style="font-size:18px">${esc(c.title)} ›</a></h2>
       <div class="top">${cardBig(ps[0])}<div class="side">${ps.slice(1).map(cardSmall).join("")}</div></div>`);
  });
}

/* ---------- Trang chi tiết (detail.html?id=...) ---------- */
function detailPage(){
  const app = document.getElementById("app");
  const id = new URLSearchParams(location.search).get("id");
  const p = getPosts().find(x => x.id === id);
  if (!p){ renderHeader(""); app.innerHTML = '<div class="empty">Không tìm thấy bài viết.</div>'; return; }
  const cat = getMenu().find(m => m.id === p.categoryId || m.title === p.category);
  renderHeader(cat ? cat.id : "");
  document.title = p.title;
  const paras = String(p.content || "").split(/\n+/).filter(s => s.trim())
    .map((s,i) => `<p class="${i === 0 && /^\(?Ảnh/.test(s) ? "cap" : ""}">${esc(s)}</p>`).join("");
  app.innerHTML = `<article class="article">
    <a class="back" href="${cat ? urlCategory(cat.id) : "index.html"}">← ${esc(p.category)}</a>
    <span class="tag" style="display:block">${esc(p.category)}</span>
    <h1>${esc(p.title)}</h1>
    <div class="info meta"><span>✍ ${esc(p.author || "Không rõ")}</span><span>🕒 ${esc(p.publishedAt)}</span><span>📂 ${esc(p.category)}</span>
      ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener" style="color:var(--red)">Nguồn: ${esc(p.source)}</a>` : ""}</div>
    ${p.excerpt ? `<p class="sapo">${esc(p.excerpt)}</p>` : ""}
    ${p.image ? `<img class="cover" referrerpolicy="no-referrer" src="${esc(p.image)}" alt="" onerror="this.style.display='none'">` : ""}
    <div class="body">${paras}</div></article>`;
}

/* ---------- Khởi động: chạy đúng hàm theo từng trang ---------- */
(async function start(){
  const page = document.body.dataset.page;      // "home" | "detail" | "crawler"
  try{ await loadData(); }
  catch(e){ document.getElementById("app").innerHTML = `<div class="empty" style="color:#b00020">${esc(e.message)}</div>`; return; }
  renderFooter();
  if (page === "home") homePage();
  else if (page === "detail") detailPage();
  else if (page === "crawler"){ renderHeader(""); initCrawlerPage(); }
})();
