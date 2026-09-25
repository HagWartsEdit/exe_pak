const E=new TextEncoder(),D=new TextDecoder();
const J=(x,s=200,o='*',extra={})=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json','access-control-allow-origin':o,'access-control-allow-headers':'Content-Type, Authorization','access-control-allow-methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS',...extra}});
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
async function mac(sec,s){let k=await crypto.subtle.importKey('raw',E.encode(sec),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);return crypto.subtle.sign('HMAC',k,E.encode(s))}
async function tok(p,sec){let h=b64(E.encode(JSON.stringify({alg:'HS256',typ:'JWT'}))),q=b64(E.encode(JSON.stringify(p)));return h+'.'+q+'.'+b64(await mac(sec,h+'.'+q))}
async function ver(t,sec){try{let[a,b,c]=t.split('.'),k=await crypto.subtle.importKey('raw',E.encode(sec),{name:'HMAC',hash:'SHA-256'},false,['verify']);if(!await crypto.subtle.verify('HMAC',k,unb(c),E.encode(a+'.'+b)))return null;let p=JSON.parse(D.decode(unb(b)));return p.exp>Date.now()/1000?p:null}catch{return null}}
async function ph(p){let s=crypto.getRandomValues(new Uint8Array(16)),k=await crypto.subtle.importKey('raw',E.encode(p),{name:'PBKDF2'},false,['deriveBits']),v=await crypto.subtle.deriveBits({name:'PBKDF2',salt:s,iterations:100000,hash:'SHA-256'},k,256);return 'v1:'+b64(s)+':'+b64(v)}
async function pc(p,x){try{let[,ss,hh]=x.split(':'),s=unb(ss),want=unb(hh),k=await crypto.subtle.importKey('raw',E.encode(p),{name:'PBKDF2'},false,['deriveBits']),v=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:s,iterations:100000,hash:'SHA-256'},k,256));return v.length==want.length&&v.every((z,i)=>z==want[i])}catch{return false}}
const body=async r=>r.json().catch(()=>({})); const clean=(x,n)=>String(x||'').trim().slice(0,n);
let ready=false;
async function ensureSchema(db){
  if(ready)return;
  const cols=await db.prepare("PRAGMA table_info(posts)").all();
  const names=(cols.results||[]).map(x=>x.name);
  if(!names.includes('download_url'))await db.prepare("ALTER TABLE posts ADD COLUMN download_url TEXT DEFAULT ''").run();
  if(!names.includes('image_data'))await db.prepare("ALTER TABLE posts ADD COLUMN image_data TEXT DEFAULT ''").run();
  if(!names.includes('view_count'))await db.prepare("ALTER TABLE posts ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0").run();
  if(!names.includes('download_count'))await db.prepare("ALTER TABLE posts ADD COLUMN download_count INTEGER NOT NULL DEFAULT 0").run();
  await db.prepare("CREATE TABLE IF NOT EXISTS comments(id INTEGER PRIMARY KEY AUTOINCREMENT,post_id INTEGER NOT NULL,user_id INTEGER,username TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT(datetime('now')),FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id,created_at DESC)").run();
  ready=true;
}
async function user(r,e){let h=r.headers.get('Authorization')||'',t=h.startsWith('Bearer ')?h.slice(7):'';return t?ver(t,e.JWT_SECRET):null}
function auth(a,o){return a?null:J({error:'برای این کار وارد حساب شو.'},401,o)}
export default {async fetch(r,e){let u=new URL(r.url),o=e.ALLOWED_ORIGIN||'*';if(r.method==='OPTIONS')return J({},204,o);
try{
 await ensureSchema(e.DB);
 if(u.pathname==='/api/public'){
   let [s,m,p,online,members,creators,comments,leaderboard]=await Promise.all([
     e.DB.prepare('SELECT * FROM site_stats WHERE id=1').first(),
     e.DB.prepare('SELECT COUNT(*) n FROM messages').first(),
     e.DB.prepare("SELECT p.id,p.title,p.body,p.image_url,p.download_url,p.category,p.author_id,p.created_at,p.view_count,p.download_count,u.username author,(SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) comment_count FROM posts p LEFT JOIN users u ON u.id=p.author_id ORDER BY p.id DESC LIMIT 60").all(),
     e.DB.prepare("SELECT COUNT(*) n FROM users WHERE last_seen>=datetime('now','-5 minutes')").first(),
     e.DB.prepare('SELECT COUNT(*) n FROM users').first(),
     e.DB.prepare("SELECT u.id,u.username,COUNT(p.id) posts,COALESCE(SUM(p.download_count),0) downloads,COALESCE(SUM(p.view_count),0) views FROM users u LEFT JOIN posts p ON p.author_id=u.id GROUP BY u.id ORDER BY downloads DESC,posts DESC LIMIT 6").all(),
     e.DB.prepare('SELECT COUNT(*) n FROM comments').first(),
     e.DB.prepare("SELECT u.username,COUNT(DISTINCT p.id) posts,COUNT(DISTINCT c.id) comments,(COUNT(DISTINCT p.id)*10+COUNT(DISTINCT c.id)*2) points FROM users u LEFT JOIN posts p ON p.author_id=u.id LEFT JOIN comments c ON c.user_id=u.id GROUP BY u.id HAVING points>0 ORDER BY points DESC LIMIT 10").all()
   ]);
   return J({stats:{...s,messages:m?.n||0,online:online?.n||0,members:members?.n||0,comments:comments?.n||0},posts:p.results||[],creators:creators.results||[],leaderboard:leaderboard.results||[]},200,o)
 }
 if(u.pathname==='/api/pageview'&&r.method==='POST'){await e.DB.prepare('UPDATE site_stats SET visits=visits+1 WHERE id=1').run();return J({ok:true},200,o)}
 if(u.pathname==='/api/register'&&r.method==='POST'){
   let b=await body(r),n=clean(b.username,24),em=clean(b.email,120).toLowerCase(),pw=String(b.password||'');
   if(n.length<3||pw.length<6||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return J({error:'اطلاعات ثبت نام صحیح نیست.'},400,o);
   if(await e.DB.prepare('SELECT id FROM users WHERE username=? OR email=?').bind(n,em).first())return J({error:'نام کاربری یا ایمیل قبلاً ثبت شده.'},409,o);
   let q=await e.DB.prepare('INSERT INTO users(username,email,password_hash) VALUES(?,?,?)').bind(n,em,await ph(pw)).run(),t=await tok({id:q.meta.last_row_id,username:n,role:'user',exp:Date.now()/1000+604800},e.JWT_SECRET);
   return J({token:t,user:{username:n,role:'user'}},201,o)
 }
 if(u.pathname==='/api/login'&&r.method==='POST'){
   let b=await body(r),x=clean(b.login,120),z=await e.DB.prepare('SELECT * FROM users WHERE email=? OR username=?').bind(x.toLowerCase(),x).first();
   if(!z||!(await pc(String(b.password||''),z.password_hash)))return J({error:'ورود ناموفق بود.'},401,o);
   await e.DB.prepare("UPDATE users SET last_seen=datetime('now') WHERE id=?").bind(z.id).run();
   return J({token:await tok({id:z.id,username:z.username,role:z.role,exp:Date.now()/1000+604800},e.JWT_SECRET),user:{username:z.username,email:z.email,role:z.role}},200,o)
 }
 if(u.pathname==='/api/me'&&r.method==='GET'){
   let a=await user(r,e);if(!a)return J({error:'وارد حساب نشده‌اید.'},401,o);let z=await e.DB.prepare('SELECT id,username,email,role,created_at,last_seen FROM users WHERE id=?').bind(a.id).first();if(!z)return J({error:'کاربر پیدا نشد.'},404,o);
   await e.DB.prepare("UPDATE users SET last_seen=datetime('now') WHERE id=?").bind(a.id).run();return J({user:z},200,o)
 }
 if(u.pathname==='/api/me'&&r.method==='PATCH'){
   let a=await user(r,e);if(!a)return J({error:'وارد حساب نشده‌اید.'},401,o);let b=await body(r),n=clean(b.username,24);
   if(n.length<3)return J({error:'نام کاربری حداقل ۳ حرف باشد.'},400,o);
   let same=await e.DB.prepare('SELECT id FROM users WHERE username=? AND id<>?').bind(n,a.id).first();if(same)return J({error:'این نام کاربری قبلاً گرفته شده.'},409,o);
   await e.DB.prepare('UPDATE users SET username=? WHERE id=?').bind(n,a.id).run();
   let z=await e.DB.prepare('SELECT id,username,email,role,created_at,last_seen FROM users WHERE id=?').bind(a.id).first();
   let t=await tok({id:z.id,username:z.username,role:z.role,exp:Date.now()/1000+604800},e.JWT_SECRET);return J({token:t,user:z},200,o)
 }
 if(u.pathname.startsWith('/api/media/')&&r.method==='GET'){
   let id=Number(u.pathname.split('/').pop()),q=await e.DB.prepare('SELECT image_data,image_url FROM posts WHERE id=?').bind(id).first();if(!q)return J({error:'تصویر پیدا نشد.'},404,o);return J({data:q.image_data||q.image_url||''},200,o)
 }
 if(u.pathname.startsWith('/api/posts/')&&u.pathname.endsWith('/view')&&r.method==='POST'){
   let parts=u.pathname.split('/'),id=Number(parts[3]);if(!id)return J({error:'پست نامعتبر است.'},400,o);let q=await e.DB.prepare('SELECT id FROM posts WHERE id=?').bind(id).first();if(!q)return J({error:'پست پیدا نشد.'},404,o);await e.DB.prepare('UPDATE posts SET view_count=view_count+1 WHERE id=?').bind(id).run();return J({ok:true},200,o)
 }
 if(u.pathname.startsWith('/api/posts/')&&u.pathname.endsWith('/download')&&r.method==='GET'){
   let parts=u.pathname.split('/'),id=Number(parts[3]),q=await e.DB.prepare('SELECT download_url FROM posts WHERE id=?').bind(id).first();if(!q||!q.download_url)return J({error:'لینک دانلود موجود نیست.'},404,o);
   await e.DB.prepare('UPDATE posts SET download_count=download_count+1 WHERE id=?').bind(id).run();await e.DB.prepare('UPDATE site_stats SET downloads=downloads+1 WHERE id=1').run();return new Response(null,{status:302,headers:{Location:q.download_url,'Cache-Control':'no-store'}})
 }
 if(u.pathname.startsWith('/api/posts/')&&u.pathname.endsWith('/comments')&&r.method==='GET'){
   let id=Number(u.pathname.split('/')[3]);let q=await e.DB.prepare("SELECT id,post_id,user_id,username,body,created_at FROM comments WHERE post_id=? ORDER BY id ASC LIMIT 200").bind(id).all();return J({comments:q.results||[]},200,o)
 }
 if(u.pathname.startsWith('/api/posts/')&&u.pathname.endsWith('/comments')&&r.method==='POST'){
   let a=await user(r,e);if(!a)return auth(a,o);let id=Number(u.pathname.split('/')[3]),b=await body(r),m=clean(b.body,800);if(!m)return J({error:'نظر خالی است.'},400,o);let p=await e.DB.prepare('SELECT id FROM posts WHERE id=?').bind(id).first();if(!p)return J({error:'پست پیدا نشد.'},404,o);
   await e.DB.prepare('INSERT INTO comments(post_id,user_id,username,body) VALUES(?,?,?,?)').bind(id,a.id,a.username,m).run();await e.DB.prepare("UPDATE users SET last_seen=datetime('now') WHERE id=?").bind(a.id).run();return J({ok:true},201,o)
 }
 if(u.pathname.startsWith('/api/comments/')&&r.method==='DELETE'){
   let a=await user(r,e);if(!a)return auth(a,o);let id=Number(u.pathname.split('/').pop()),c=await e.DB.prepare('SELECT user_id FROM comments WHERE id=?').bind(id).first();if(!c)return J({error:'نظر پیدا نشد.'},404,o);if(c.user_id!==a.id&&a.role!=='admin')return J({error:'دسترسی ندارید.'},403,o);await e.DB.prepare('DELETE FROM comments WHERE id=?').bind(id).run();return J({ok:true},200,o)
 }
 if(u.pathname.startsWith('/api/posts/')&&r.method==='GET'){
   let id=Number(u.pathname.split('/').pop()),p=await e.DB.prepare("SELECT p.*,u.username author,(SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) comment_count FROM posts p LEFT JOIN users u ON u.id=p.author_id WHERE p.id=?").bind(id).first();if(!p)return J({error:'پست پیدا نشد.'},404,o);return J({post:p},200,o)
 }
 if(u.pathname==='/api/chat'&&r.method==='GET'){
   let q=await e.DB.prepare("SELECT m.id,m.username,m.body,m.created_at,COALESCE(u.role,'user') role FROM messages m LEFT JOIN users u ON u.id=m.user_id ORDER BY m.id DESC LIMIT 100").all();return J({messages:(q.results||[]).reverse()},200,o)
 }
 if(u.pathname==='/api/chat'&&r.method==='POST'){
   let a=await user(r,e);if(!a)return auth(a,o);let b=await body(r),m=clean(b.body,500);if(!m)return J({error:'پیام خالی است.'},400,o);await e.DB.prepare('INSERT INTO messages(user_id,username,body) VALUES(?,?,?)').bind(a.id,a.username,m).run();await e.DB.prepare("UPDATE users SET last_seen=datetime('now') WHERE id=?").bind(a.id).run();return J({ok:true},201,o)
 }
 if(u.pathname==='/api/admin/posts'&&r.method==='GET'){
   let a=await user(r,e);if(a?.role!=='admin')return J({error:'دسترسی مدیر لازم است.'},403,o);let q=await e.DB.prepare("SELECT p.*,u.username author,(SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) comment_count FROM posts p LEFT JOIN users u ON u.id=p.author_id ORDER BY p.id DESC LIMIT 200").all();return J({posts:q.results||[]},200,o)
 }
 if(u.pathname==='/api/admin/posts'&&r.method==='POST'){
   let a=await user(r,e);if(a?.role!=='admin')return J({error:'دسترسی مدیر لازم است.'},403,o);let b=await body(r),img=String(b.image_data||'');if(img.length>900000)return J({error:'حجم عکس زیاد است. عکس کوچک‌تر انتخاب کن.'},400,o);
   let q=await e.DB.prepare('INSERT INTO posts(title,body,image_url,download_url,image_data,category,author_id) VALUES(?,?,?,?,?,?,?)').bind(clean(b.title,120),clean(b.body,5000),clean(b.image_url,500),clean(b.download_url,1000),img,clean(b.category,40)||'مود',a.id).run();return J({id:q.meta.last_row_id},201,o)
 }
 if(u.pathname.startsWith('/api/admin/posts/')&&r.method==='PUT'){
   let a=await user(r,e);if(a?.role!=='admin')return J({error:'دسترسی مدیر لازم است.'},403,o);let id=Number(u.pathname.split('/').pop()),b=await body(r),img=String(b.image_data||'');if(img.length>900000)return J({error:'حجم عکس زیاد است. عکس کوچک‌تر انتخاب کن.'},400,o);let q=await e.DB.prepare('SELECT image_data FROM posts WHERE id=?').bind(id).first();if(!q)return J({error:'پست پیدا نشد.'},404,o);if(!img)img=q.image_data||'';await e.DB.prepare('UPDATE posts SET title=?,body=?,image_url=?,download_url=?,image_data=?,category=? WHERE id=?').bind(clean(b.title,120),clean(b.body,5000),clean(b.image_url,500),clean(b.download_url,1000),img,clean(b.category,40)||'مود',id).run();return J({ok:true},200,o)
 }
 if(u.pathname.startsWith('/api/admin/posts/')&&r.method==='DELETE'){
   let a=await user(r,e);if(a?.role!=='admin')return J({error:'دسترسی مدیر لازم است.'},403,o);await e.DB.prepare('DELETE FROM posts WHERE id=?').bind(Number(u.pathname.split('/').pop())).run();return J({ok:true},200,o)
 }
 if(u.pathname==='/api/admin/users'){
   let a=await user(r,e);if(a?.role!=='admin')return J({error:'دسترسی مدیر لازم است.'},403,o);let q=await e.DB.prepare('SELECT id,username,email,role,created_at FROM users ORDER BY id DESC LIMIT 200').all();return J({users:q.results||[]},200,o)
 }
 if(r.method==='GET')return e.ASSETS.fetch(r);
 return J({error:'Not found'},404,o)
}catch(x){return J({error:'خطای سرور',detail:e.DEBUG==='1'?String(x):undefined},500,o)}}};
