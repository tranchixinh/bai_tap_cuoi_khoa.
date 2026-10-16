/* ===== Hàm crawl: nhận URL bài viết -> trả về object chuẩn hóa ===== */
const WORKER = "https://dantri-proxy.24103163.workers.dev";

const PROXIES = [
  // [hàm tạo URL, kiểu trả về]  "json" = {contents:"..."} ; "text" = HTML thô
  [u => WORKER + "/?url=" + encodeURIComponent(u), "text"],
  [u => "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(u), "text"],
  [u => "https://api.allorigins.win/get?url=" + encodeURIComponent(u), "json"],
  [u => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u), "text"]
];

async function fetchHTML(url, onTry){
  let lastErr;
  for(const [mk, kind] of PROXIES){
    try{
      if(onTry) onTry(mk(url));
      const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),10000);
      const res=await fetch(mk(url),{signal:ctrl.signal}); clearTimeout(t);
      if(!res.ok) throw new Error("HTTP "+res.status);
      let html = kind==="json" ? (await res.json()).contents : await res.text();
      if(html && html.length>2000) return html;
      throw new Error("Nội dung quá ngắn");
    }catch(e){lastErr=e;}
  }
  throw new Error("Tất cả proxy đều lỗi ("+(lastErr&&lastErr.message)+"). Hãy dùng cách dán mã nguồn HTML bên dưới.");
}

const clean = s => (s||"").replace(/\s+/g," ").trim();
const meta = (doc,sel) => clean(doc.querySelector(sel)?.getAttribute("content"));

function jsonLd(doc){
  for(const s of doc.querySelectorAll('script[type="application/ld+json"]')){
    try{
      let d=JSON.parse(s.textContent); if(Array.isArray(d)) d=d.find(x=>/Article/.test(x["@type"]))||d[0];
      if(d&&d["@graph"]) d=d["@graph"].find(x=>/Article/.test(x["@type"]))||d;
      if(d&&/Article/.test(String(d["@type"]))) return d;
    }catch(e){}
  }
  return {};
}
// "2026-09-28T12:22:46+07:00" -> "2026-09-28 12:22" (giờ Việt Nam)
function fmtVN(iso){
  if(!iso) return "";
  const m=iso.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if(m && /([+-]07:?00)$/.test(iso)) return m[1]+" "+m[2];
  const d=new Date(iso); if(isNaN(d)) return iso;
  const v=new Date(d.getTime()+7*3600*1000), p=n=>String(n).padStart(2,"0");
  return `${v.getUTCFullYear()}-${p(v.getUTCMonth()+1)}-${p(v.getUTCDate())} ${p(v.getUTCHours())}:${p(v.getUTCMinutes())}`;
}

async function crawlArticle(url, htmlOverride){
  url=url.trim();
  const u=new URL(url); // ném lỗi nếu URL sai
  const html=htmlOverride && htmlOverride.trim() ? htmlOverride : await fetchHTML(url);
  const doc=new DOMParser().parseFromString(html,"text/html");
  const ld=jsonLd(doc);

  // id & slug lấy từ URL: .../ten-bai-viet-20260928122246655.htm
  const last=u.pathname.split("/").filter(Boolean).pop().replace(/\.htm.*$/,"");
  const mid=last.match(/-(\d{10,})$/);
  const rawId=mid?mid[1]:last;
  const slug=mid?last.slice(0,-(mid[1].length+1)):last;

  const title=clean(doc.querySelector("h1.title-page, h1.e-magazine__title, h1")?.textContent)||meta(doc,'meta[property="og:title"]')||clean(ld.headline);
  const excerpt=clean(doc.querySelector(".singular-sapo, h2.sapo, .article__sapo")?.textContent)||meta(doc,'meta[property="og:description"]')||clean(ld.description);

  // nội dung: gom các đoạn <p> và chú thích ảnh trong phần thân bài
  const body=doc.querySelector(".singular-content, .e-magazine__body, article");
  let paras=[];
  if(body){
    body.querySelectorAll("p, figcaption").forEach(el=>{
      if(el.closest(".related-news, .article-related, .box-news")) return;
      const t=clean(el.textContent); if(t && t.length>1) paras.push(t);
    });
  }
  const content=[...new Set(paras)].join("\n\n");

  // tác giả
  let author=clean(doc.querySelector(".author-name, .author-info .name, [itemprop=author]")?.textContent);
  if(!author){const a=ld.author; author=clean(Array.isArray(a)?a[0]?.name:(a&&a.name)||(typeof a==="string"?a:""));}
  if(!author) author=meta(doc,'meta[name="author"]');

  // thời gian
  const iso=meta(doc,'meta[property="article:published_time"]')||ld.datePublished||doc.querySelector("time")?.getAttribute("datetime")||"";
  let publishedAt=fmtVN(iso);
  if(!publishedAt){const t=clean(doc.querySelector(".author-time, time")?.textContent);publishedAt=t;}

  // chuyên mục: ưu tiên khớp theo đường dẫn URL với danh mục của web
  const seg=u.pathname.split("/").filter(Boolean)[0];
  const known=getMenu().find(m=>m.id===seg);
  let category=known?known.title:clean(doc.querySelector(".breadcrumbs a, .breadcrumb a")?.textContent)||clean(ld.articleSection)||meta(doc,'meta[property="article:section"]');

  const image=meta(doc,'meta[property="og:image"]')||(typeof ld.image==="string"?ld.image:ld.image?.url)||"";
  if(!title||!content) throw new Error("Không trích xuất được tiêu đề/nội dung. Có thể URL không phải bài viết hoặc trang đổi cấu trúc.");

  return {
    id:"dtri-"+rawId, title, slug, excerpt, content, author, category, publishedAt,
    source:u.hostname.replace(/^www\./,""), url,
    image, categoryId: known?known.id:seg  // 2 trường phụ để hiển thị ảnh & lọc chuyên mục
  };
}

/* ===== Giao diện Crawler Page (được main.js gọi) ===== */
function initCrawlerPage(){

  const form=document.getElementById("crawlForm"), input=document.getElementById("urlInput"),
        status=document.getElementById("status"), out=document.getElementById("result"),
        btn=document.getElementById("crawlBtn"), saved=document.getElementById("saved");
  const setStatus=(cls,msg)=>{status.className="status "+cls;status.textContent=msg;};

  function renderSaved(){
    const ps=sortNewest(getPosts()).slice(0,8);
    saved.innerHTML=ps.map(p=>`<div class="row"><a href="${urlPost(p)}">${esc(p.title)}</a><span class="meta">${esc(p.category)}</span></div>`).join("");
  }
  form.addEventListener("submit",async e=>{
    e.preventDefault(); out.textContent=""; btn.disabled=true; setStatus("load","Đang tải và phân tích bài viết...");
    try{
      const art=await crawlArticle(input.value, document.getElementById("htmlInput").value);
      out.textContent=JSON.stringify(art,null,2);
      // lưu vào LocalStorage (ghi đè nếu trùng id)
      const posts=getPosts(); const i=posts.findIndex(p=>p.id===art.id);
      if(i>=0) posts[i]=art; else posts.unshift(art);
      savePosts(posts);
      setStatus("ok",(i>=0?"Đã cập nhật":"Đã lưu")+" bài viết vào LocalStorage. Xem tại trang chủ / chuyên mục "+art.category+".");
      renderSaved();
    }catch(err){setStatus("err","Lỗi: "+err.message);}
    finally{btn.disabled=false;}
  });
  document.getElementById("resetBtn").onclick=()=>{
    if(confirm("Xóa dữ liệu LocalStorage và nạp lại dữ liệu mẫu?")){localStorage.removeItem(KEY_POSTS);localStorage.removeItem(KEY_MENU);location.reload();}
  };
  renderSaved();
}
