/* ===== data.js: đọc/ghi dữ liệu (LocalStorage) và hàm dùng chung ===== */
const KEY_POSTS = "news_posts";
const KEY_MENU  = "news_menu";

// Chống lỗi XSS khi chèn text vào HTML
function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// Lần đầu: đọc data/menu.json + data/posts.json rồi lưu vào LocalStorage
async function loadData(){
  if (localStorage.getItem(KEY_POSTS) && localStorage.getItem(KEY_MENU)) return;
  try{
    const [menu, posts] = await Promise.all([
      fetch("data/menu.json").then(r => r.json()),
      fetch("data/posts.json").then(r => r.json())
    ]);
    localStorage.setItem(KEY_MENU, JSON.stringify(menu));
    localStorage.setItem(KEY_POSTS, JSON.stringify(posts));
  }catch(e){
    throw new Error("Không đọc được file JSON. Hãy mở web bằng Live Server (không double-click file html).");
  }
}
function getMenu(){ return (JSON.parse(localStorage.getItem(KEY_MENU) || '{"menu":[]}')).menu; }
function getPosts(){ return JSON.parse(localStorage.getItem(KEY_POSTS) || "[]"); }
function savePosts(p){ localStorage.setItem(KEY_POSTS, JSON.stringify(p)); }

// Các chuyên mục thật sự có bài viết
function getCategories(){ return getMenu().filter(m => m.type === "category" && m.id !== "latest"); }
function sortNewest(arr){ return [...arr].sort((a,b) => String(b.publishedAt).localeCompare(String(a.publishedAt))); }
function postsOfCategory(id){
  const cat = getMenu().find(m => m.id === id);
  return sortNewest(getPosts().filter(p => p.categoryId === id || (cat && p.category === cat.title)));
}
// Đường dẫn
const urlCategory = id => "index.html?cat=" + encodeURIComponent(id);
const urlPost     = p  => "detail.html?id=" + encodeURIComponent(p.id);
