const json = (data, status=200, origin="*") => new Response(JSON.stringify(data), {
  status,
  headers: {"content-type":"application/json;charset=UTF-8","Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS"}
});

const text = (s,status=200,origin="*") => new Response(s,{status,headers:{"content-type":"text/plain;charset=UTF-8","Access-Control-Allow-Origin":origin}});

function originOf(req){ return req.headers.get("Origin") || "*"; }
function b64u(buf){return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function ub64(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function sha256(s){return crypto.subtle.digest("SHA-256",new TextEncoder().encode(s))}
async function derive(password,salt){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:10000,hash:"SHA-256"},key,256);
 return b64u(bits);
}
async function sign(payload,secret){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return b64u(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload)));
}
async function token(user,secret){
 const p=b64u(new TextEncoder().encode(JSON.stringify({id:user.id,email:user.email,role:user.role,exp:Date.now()+1000*60*60*24*7})));
 return p+"."+await sign(p,secret);
}
async function auth(req,env){
 const h=req.headers.get("Authorization")||""; if(!h.startsWith("Bearer ")) return null;
 const t=h.slice(7), [p,s]=t.split("."); if(!p||!s)return null;
 if((await sign(p,env.JWT_SECRET))!==s)return null;
 try{const u=JSON.parse(new TextDecoder().decode(ub64(p)));if(u.exp<Date.now())return null;return u}catch{return null}
}
async function body(req){return await req.json().catch(()=>({}))}

async function publicData(env){
 const [mods,packs,cats,stats]=await Promise.all([
  env.DB.prepare("SELECT * FROM mods WHERE active=1 ORDER BY featured DESC, created_at DESC").all(),
  env.DB.prepare("SELECT * FROM packs WHERE active=1 ORDER BY created_at DESC").all(),
  env.DB.prepare("SELECT id,name FROM categories ORDER BY sort_order ASC").all(),
  env.DB.prepare("SELECT views,downloads FROM site_stats WHERE id=1").first()
 ]);
 const users=await env.DB.prepare("SELECT COUNT(*) n FROM users").first();
 return {mods:mods.results||[],packs:packs.results||[],categories:cats.results||[],stats:{views:stats?.views||0,downloads:stats?.downloads||0,users:users?.n||0}};
}

function safeFields(x){
 return {
  id:x.id||crypto.randomUUID(),name:x.name||"",category:x.category||"gameplay",categoryName:x.categoryName||"",
  description:x.description||"",image:x.image||"",downloadUrl:x.downloadUrl||"",sourceUrl:x.sourceUrl||"",
  size:x.size||"",version:x.version||"",author:x.author||"",featured:x.featured?1:0,active:x.active===false?0:1
 };
}

async function zarSync(env, url){
 const r=await fetch(url,{headers:{"User-Agent":"EXE-PAK/1.0"}});
 if(!r.ok) throw new Error("ZarGame پاسخ نداد");
 const html=await r.text();
 const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"").replace(/<[^>]+>/g,"").trim();
 const desc=(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1]||"").trim();
 const image=(html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)/i)?.[1]||"").trim();
 const download=(html.match(/href=["']([^"']+\.(?:zip|rar|7z)(?:\?[^"']*)?)["']/i)?.[1]||"").trim();
 return {name:title.replace(/\s*-\s*زرگیم.*$/i,"").trim(),description:desc,image,downloadUrl:download,sourceUrl:url,category:"gameplay",categoryName:"گیم‌پلی",author:"ZarGame",active:1,featured:0};
}

export default {
 async fetch(req,env){
  const origin=originOf(req);
  if(req.method==="OPTIONS") return json({},204,origin);
  const u=new URL(req.url);
  try{
   if(u.pathname==="/api/public"&&req.method==="GET") return json(await publicData(env),200,origin);

   if(u.pathname==="/api/auth/register"&&req.method==="POST"){
    const b=await body(req); if(!b.name||!b.email||!b.password||b.password.length<8)return json({error:"اطلاعات ثبت‌نام کامل نیست"},400,origin);
    const exists=await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(b.email.toLowerCase()).first();if(exists)return json({error:"این ایمیل قبلاً ثبت شده"},409,origin);
    const id=crypto.randomUUID(),salt=btoa(crypto.randomUUID()),hash=await derive(b.password,salt);
    await env.DB.prepare("INSERT INTO users(id,name,email,password_hash,salt,role) VALUES(?,?,?,?,?,?)").bind(id,b.name,b.email.toLowerCase(),hash,salt,"user").run();
    return json({token:await token({id,email:b.email.toLowerCase(),role:"user"},env.JWT_SECRET)},201,origin);
   }

   if(u.pathname==="/api/auth/login"&&req.method==="POST"){
    const b=await body(req), usr=await env.DB.prepare("SELECT * FROM users WHERE email=?").bind((b.email||"").toLowerCase()).first();
    if(!usr)return json({error:"ایمیل یا رمز عبور اشتباه است"},401,origin);
    const hash=await derive(b.password||"",usr.salt);if(hash!==usr.password_hash)return json({error:"ایمیل یا رمز عبور اشتباه است"},401,origin);
    return json({token:await token(usr,env.JWT_SECRET),role:usr.role},200,origin);
   }

   if(u.pathname==="/api/stats/view"&&req.method==="POST"){
    await env.DB.prepare("UPDATE site_stats SET views=views+1 WHERE id=1").run();return json({ok:true},200,origin);
   }
   if(u.pathname==="/api/stats/download"&&req.method==="POST"){
    const b=await body(req);await env.DB.prepare("UPDATE site_stats SET downloads=downloads+1 WHERE id=1").run();
    if(b.id) await env.DB.prepare("UPDATE mods SET downloads=downloads+1 WHERE id=?").bind(b.id).run().catch(()=>{});
    return json({ok:true},200,origin);
   }

   const user=await auth(req,env);
   if(u.pathname==="/api/admin/me"&&req.method==="GET")return user&&user.role==="admin"?json({ok:true,user},200,origin):json({error:"دسترسی غیرمجاز"},403,origin);

   if(u.pathname==="/api/admin/setup"&&req.method==="POST"){
    if((u.searchParams.get("secret")||"")!==env.SETUP_SECRET)return json({error:"کلید راه‌اندازی اشتباه است"},403,origin);
    const n=await env.DB.prepare("SELECT COUNT(*) n FROM users WHERE role='admin'").first();if(n.n>0)return json({error:"مدیر قبلاً ساخته شده"},409,origin);
    const b=await body(req);if(!b.email||!b.password||b.password.length<10)return json({error:"رمز مدیر حداقل ۱۰ کاراکتر باشد"},400,origin);
    const id=crypto.randomUUID(),salt=btoa(crypto.randomUUID()),hash=await derive(b.password,salt);
    await env.DB.prepare("INSERT INTO users(id,name,email,password_hash,salt,role) VALUES(?,?,?,?,?,?)").bind(id,b.name||"Admin",b.email.toLowerCase(),hash,salt,"admin").run();
    return json({ok:true},201,origin);
   }

   if(!user||user.role!=="admin") return json({error:"دسترسی غیرمجاز"},403,origin);

   if(u.pathname==="/api/admin/mods"&&req.method==="GET")return json(await env.DB.prepare("SELECT * FROM mods ORDER BY created_at DESC").all(),200,origin);
   if(u.pathname==="/api/admin/mods"&&req.method==="POST"){
    const x=safeFields(await body(req));
    await env.DB.prepare(`INSERT INTO mods(id,name,category,categoryName,description,image,downloadUrl,sourceUrl,size,version,author,featured,active) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,category=excluded.category,categoryName=excluded.categoryName,description=excluded.description,image=excluded.image,downloadUrl=excluded.downloadUrl,sourceUrl=excluded.sourceUrl,size=excluded.size,version=excluded.version,author=excluded.author,featured=excluded.featured,active=excluded.active`).bind(x.id,x.name,x.category,x.categoryName,x.description,x.image,x.downloadUrl,x.sourceUrl,x.size,x.version,x.author,x.featured,x.active).run();
    return json({ok:true,id:x.id},200,origin);
   }
   if(u.pathname.startsWith("/api/admin/mods/")&&req.method==="DELETE"){
    const id=u.pathname.split("/").pop();await env.DB.prepare("DELETE FROM mods WHERE id=?").bind(id).run();return json({ok:true},200,origin);
   }
   if(u.pathname==="/api/admin/packs"&&req.method==="POST"){
    const x=safeFields(await body(req));
    await env.DB.prepare(`INSERT INTO packs(id,name,category,categoryName,description,image,downloadUrl,sourceUrl,size,version,author,featured,active) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,category=excluded.category,categoryName=excluded.categoryName,description=excluded.description,image=excluded.image,downloadUrl=excluded.downloadUrl,sourceUrl=excluded.sourceUrl,size=excluded.size,version=excluded.version,author=excluded.author,featured=excluded.featured,active=excluded.active`).bind(x.id,x.name,x.category,x.categoryName,x.description,x.image,x.downloadUrl,x.sourceUrl,x.size,x.version,x.author,x.featured,x.active).run();
    return json({ok:true,id:x.id},200,origin);
   }
   if(u.pathname==="/api/admin/sync-zargame"&&req.method==="POST"){
    const b=await body(req);if(!b.url)return json({error:"آدرس زرگیم را وارد کن"},400,origin);
    const x=safeFields(await zarSync(env,b.url));x.sourceUrl=b.url;
    await env.DB.prepare(`INSERT INTO mods(id,name,category,categoryName,description,image,downloadUrl,sourceUrl,size,version,author,featured,active) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,image=excluded.image,downloadUrl=excluded.downloadUrl,sourceUrl=excluded.sourceUrl,author=excluded.author,active=1`).bind(x.id,x.name,x.category,x.categoryName,x.description,x.image,x.downloadUrl,x.sourceUrl,x.size,x.version,x.author,x.featured,x.active).run();
    return json({ok:true,item:x},200,origin);
   }
   return json({error:"Not found"},404,origin);
  }catch(e){return json({error:e.message||"خطای سرور"},500,origin)}
 }
};
