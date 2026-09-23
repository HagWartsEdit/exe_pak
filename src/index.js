const json = (data, status=200, origin="*") => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type":"application/json;charset=UTF-8",
    "Access-Control-Allow-Origin":origin,
    "Access-Control-Allow-Headers":"Content-Type, Authorization",
    "Access-Control-Allow-Methods":"GET,POST,PUT,PATCH,DELETE,OPTIONS"
  }
});

const text = (s,status=200,origin="*") => new Response(s,{status,headers:{"content-type":"text/plain;charset=UTF-8","Access-Control-Allow-Origin":origin}});

function originOf(req){ return req.headers.get("Origin") || "*"; }
function b64u(buf){return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function ub64(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function derive(password,salt){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:10000,hash:"SHA-256"},key,256);
  return b64u(bits);
}
async function sign(payload,secret){
  if(!secret) throw new Error("JWT_SECRET تنظیم نشده است");
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return b64u(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload)));
}
async function token(user,secret){
  const p=b64u(new TextEncoder().encode(JSON.stringify({
    id:user.id,email:user.email,role:user.role,name:user.name||"",exp:Date.now()+1000*60*60*24*7
  })));
  return p+"."+await sign(p,secret);
}
async function auth(req,env){
  const h=req.headers.get("Authorization")||"";
  if(!h.startsWith("Bearer ")) return null;
  const t=h.slice(7), [p,s]=t.split(".");
  if(!p||!s||!env.JWT_SECRET)return null;
  try{
    if((await sign(p,env.JWT_SECRET))!==s)return null;
    const u=JSON.parse(new TextDecoder().decode(ub64(p)));
    if(u.exp<Date.now())return null;
    return u;
  }catch{return null}
}
async function body(req){return await req.json().catch(()=>({}))}

async function ensureExtras(env){
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS user_favorites (
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id,item_type,item_id)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS download_history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      item_type TEXT NOT NULL,
      item_id TEXT,
      item_name TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)
  ]);
}

async function publicData(env){
  await ensureExtras(env);
  const [mods,packs,cats,stats,users]=await Promise.all([
    env.DB.prepare("SELECT * FROM mods WHERE active=1 ORDER BY featured DESC, created_at DESC").all(),
    env.DB.prepare("SELECT * FROM packs WHERE active=1 ORDER BY featured DESC, created_at DESC").all(),
    env.DB.prepare("SELECT id,name FROM categories ORDER BY sort_order ASC").all(),
    env.DB.prepare("SELECT views,downloads FROM site_stats WHERE id=1").first(),
    env.DB.prepare("SELECT COUNT(*) n FROM users WHERE role='user'").first()
  ]);
  return {
    mods:mods.results||[],
    packs:packs.results||[],
    categories:cats.results||[],
    stats:{views:stats?.views||0,downloads:stats?.downloads||0,users:users?.n||0}
  };
}

function safeFields(x){
  return {
    id:x.id||crypto.randomUUID(), name:String(x.name||"").trim(),
    category:x.category||"gameplay", categoryName:x.categoryName||"",
    description:x.description||"",image:x.image||"",downloadUrl:x.downloadUrl||"",sourceUrl:x.sourceUrl||"",
    size:x.size||"",version:x.version||"",author:x.author||"",
    featured:x.featured?1:0,active:x.active===false?0:1
  };
}
function packFields(x){ return safeFields(x); }

async function saveMod(env,x){
  await env.DB.prepare(`INSERT INTO mods
    (id,name,category,categoryName,description,image,downloadUrl,sourceUrl,size,version,author,featured,active)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
    name=excluded.name,category=excluded.category,categoryName=excluded.categoryName,
    description=excluded.description,image=excluded.image,downloadUrl=excluded.downloadUrl,
    sourceUrl=excluded.sourceUrl,size=excluded.size,version=excluded.version,author=excluded.author,
    featured=excluded.featured,active=excluded.active`)
    .bind(x.id,x.name,x.category,x.categoryName,x.description,x.image,x.downloadUrl,x.sourceUrl,x.size,x.version,x.author,x.featured,x.active).run();
}
async function savePack(env,x){
  await env.DB.prepare(`INSERT INTO packs
    (id,name,category,categoryName,description,image,downloadUrl,sourceUrl,size,version,author,featured,active)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
    name=excluded.name,category=excluded.category,categoryName=excluded.categoryName,
    description=excluded.description,image=excluded.image,downloadUrl=excluded.downloadUrl,
    sourceUrl=excluded.sourceUrl,size=excluded.size,version=excluded.version,author=excluded.author,
    featured=excluded.featured,active=excluded.active`)
    .bind(x.id,x.name,x.category,x.categoryName,x.description,x.image,x.downloadUrl,x.sourceUrl,x.size,x.version,x.author,x.featured,x.active).run();
}

async function zarSync(env,url){
  const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 EXE-PAK/2.0"}});
  if(!r.ok) throw new Error("صفحه منبع پاسخ نداد");
  const html=await r.text();
  const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"").replace(/<[^>]+>/g,"").trim();
  const desc=(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1]||"").trim();
  const image=(html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)/i)?.[1]||"").trim();
  let download=(html.match(/href=["']([^"']+\.(?:zip|rar|7z)(?:\?[^"']*)?)["']/i)?.[1]||"").trim();
  if(download && !/^https?:\/\//i.test(download)) download=new URL(download,url).href;
  return {
    id:crypto.randomUUID(),
    name:title.replace(/\s*-\s*زرگیم.*$/i,"").trim()||"مود جدید",
    description:desc,image,downloadUrl:download,sourceUrl:url,
    category:"gameplay",categoryName:"گیم‌پلی",author:"ZarGame",active:1,featured:0
  };
}

function requireAdmin(user){return user&&user.role==="admin"}
async function getUser(env,id){
  return await env.DB.prepare("SELECT id,name,email,role,created_at FROM users WHERE id=?").bind(id).first();
}

export default {
 async fetch(req,env){
  const origin=originOf(req);
  if(req.method==="OPTIONS") return json({},204,origin);
  const u=new URL(req.url);
  try{
    if(u.pathname==="/api/public"&&req.method==="GET") return json(await publicData(env),200,origin);

    if(u.pathname==="/api/auth/register"&&req.method==="POST"){
      const b=await body(req);
      if(!b.name||!b.email||!b.password||b.password.length<8)return json({error:"اطلاعات ثبت‌نام کامل نیست"},400,origin);
      const email=String(b.email).toLowerCase().trim();
      const exists=await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
      if(exists)return json({error:"این ایمیل قبلاً ثبت شده"},409,origin);
      const id=crypto.randomUUID(),salt=btoa(crypto.randomUUID()),hash=await derive(b.password,salt);
      await env.DB.prepare("INSERT INTO users(id,name,email,password_hash,salt,role) VALUES(?,?,?,?,?,?)")
        .bind(id,String(b.name).trim(),email,hash,salt,"user").run();
      return json({token:await token({id,email,role:"user",name:String(b.name).trim()},env.JWT_SECRET),role:"user"},201,origin);
    }

    if(u.pathname==="/api/auth/login"&&req.method==="POST"){
      const b=await body(req);
      const email=String(b.email||"").toLowerCase().trim();
      const usr=await env.DB.prepare("SELECT * FROM users WHERE email=?").bind(email).first();
      if(!usr)return json({error:"ایمیل یا رمز عبور اشتباه است"},401,origin);
      const hash=await derive(b.password||"",usr.salt);
      if(hash!==usr.password_hash)return json({error:"ایمیل یا رمز عبور اشتباه است"},401,origin);
      return json({token:await token(usr,env.JWT_SECRET),role:usr.role},200,origin);
    }

    if(u.pathname==="/api/stats/view"&&req.method==="POST"){
      await env.DB.prepare("UPDATE site_stats SET views=views+1 WHERE id=1").run();
      return json({ok:true},200,origin);
    }

    if(u.pathname==="/api/stats/download"&&req.method==="POST"){
      await ensureExtras(env);
      const b=await body(req), itemType=b.type==="pack"?"pack":"mod";
      await env.DB.prepare("UPDATE site_stats SET downloads=downloads+1 WHERE id=1").run();
      if(b.id){
        if(itemType==="mod") await env.DB.prepare("UPDATE mods SET downloads=downloads+1 WHERE id=?").bind(b.id).run().catch(()=>{});
        const user=await auth(req,env);
        if(user){
          const table=itemType==="mod"?"mods":"packs";
          const item=await env.DB.prepare(`SELECT name FROM ${table} WHERE id=?`).bind(b.id).first();
          await env.DB.prepare("INSERT INTO download_history(id,user_id,item_type,item_id,item_name) VALUES(?,?,?,?,?)")
            .bind(crypto.randomUUID(),user.id,itemType,b.id,item?.name||"").run();
        }
      }
      return json({ok:true},200,origin);
    }

    const user=await auth(req,env);

    if(u.pathname==="/api/account"&&req.method==="GET"){
      if(!user)return json({error:"وارد حساب نشده‌اید"},401,origin);
      await ensureExtras(env);
      const me=await getUser(env,user.id);
      const favorites=await env.DB.prepare("SELECT item_type,item_id,created_at FROM user_favorites WHERE user_id=? ORDER BY created_at DESC").bind(user.id).all();
      const downloads=await env.DB.prepare("SELECT id,item_type,item_id,item_name,created_at FROM download_history WHERE user_id=? ORDER BY created_at DESC LIMIT 100").bind(user.id).all();
      return json({user:me,favorites:favorites.results||[],downloads:downloads.results||[]},200,origin);
    }

    if(u.pathname==="/api/account/profile"&&req.method==="PATCH"){
      if(!user)return json({error:"وارد حساب نشده‌اید"},401,origin);
      const b=await body(req); if(!b.name||String(b.name).trim().length<2)return json({error:"نام معتبر نیست"},400,origin);
      await env.DB.prepare("UPDATE users SET name=? WHERE id=?").bind(String(b.name).trim(),user.id).run();
      return json({ok:true},200,origin);
    }

    if(u.pathname==="/api/account/password"&&req.method==="POST"){
      if(!user)return json({error:"وارد حساب نشده‌اید"},401,origin);
      const b=await body(req);
      const usr=await env.DB.prepare("SELECT * FROM users WHERE id=?").bind(user.id).first();
      if(!usr||!b.currentPassword||!b.newPassword)return json({error:"همه فیلدها لازم است"},400,origin);
      if(String(b.newPassword).length<8)return json({error:"رمز جدید حداقل ۸ کاراکتر باشد"},400,origin);
      if(await derive(b.currentPassword,usr.salt)!==usr.password_hash)return json({error:"رمز فعلی اشتباه است"},400,origin);
      const salt=btoa(crypto.randomUUID()),hash=await derive(b.newPassword,salt);
      await env.DB.prepare("UPDATE users SET password_hash=?,salt=? WHERE id=?").bind(hash,salt,user.id).run();
      return json({ok:true},200,origin);
    }

    if(u.pathname==="/api/account/favorite"&&req.method==="POST"){
      if(!user)return json({error:"وارد حساب شوید"},401,origin);
      await ensureExtras(env);
      const b=await body(req), type=b.type==="pack"?"pack":"mod";
      if(!b.id)return json({error:"شناسه نامعتبر"},400,origin);
      const exists=await env.DB.prepare("SELECT 1 FROM user_favorites WHERE user_id=? AND item_type=? AND item_id=?").bind(user.id,type,b.id).first();
      if(exists){
        await env.DB.prepare("DELETE FROM user_favorites WHERE user_id=? AND item_type=? AND item_id=?").bind(user.id,type,b.id).run();
        return json({favorite:false},200,origin);
      }
      await env.DB.prepare("INSERT INTO user_favorites(user_id,item_type,item_id) VALUES(?,?,?)").bind(user.id,type,b.id).run();
      return json({favorite:true},200,origin);
    }

    if(u.pathname==="/api/admin/me"&&req.method==="GET"){
      return requireAdmin(user)?json({ok:true,user},200,origin):json({error:"دسترسی غیرمجاز"},403,origin);
    }

    if(u.pathname==="/api/admin/setup"&&req.method==="POST"){
      if(!env.SETUP_SECRET)return json({error:"SETUP_SECRET تنظیم نشده است"},500,origin);
      if((u.searchParams.get("secret")||"")!==env.SETUP_SECRET)return json({error:"کلید راه‌اندازی اشتباه است"},403,origin);
      const n=await env.DB.prepare("SELECT COUNT(*) n FROM users WHERE role='admin'").first();
      if(n.n>0)return json({error:"مدیر قبلاً ساخته شده"},409,origin);
      const b=await body(req);
      if(!b.email||!b.password||String(b.password).length<10)return json({error:"رمز مدیر حداقل ۱۰ کاراکتر باشد"},400,origin);
      const id=crypto.randomUUID(),email=String(b.email).toLowerCase().trim(),salt=btoa(crypto.randomUUID()),hash=await derive(b.password,salt);
      await env.DB.prepare("INSERT INTO users(id,name,email,password_hash,salt,role) VALUES(?,?,?,?,?,?)")
        .bind(id,String(b.name||"Admin").trim(),email,hash,salt,"admin").run();
      return json({ok:true},201,origin);
    }

    if(!requireAdmin(user)) return json({error:"دسترسی غیرمجاز"},403,origin);

    if(u.pathname==="/api/admin/dashboard"&&req.method==="GET"){
      await ensureExtras(env);
      const [users,mods,packs,stats,recent]=await Promise.all([
        env.DB.prepare("SELECT COUNT(*) n FROM users WHERE role='user'").first(),
        env.DB.prepare("SELECT COUNT(*) n FROM mods WHERE active=1").first(),
        env.DB.prepare("SELECT COUNT(*) n FROM packs WHERE active=1").first(),
        env.DB.prepare("SELECT views,downloads FROM site_stats WHERE id=1").first(),
        env.DB.prepare("SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC LIMIT 8").all()
      ]);
      return json({users:users?.n||0,mods:mods?.n||0,packs:packs?.n||0,views:stats?.views||0,downloads:stats?.downloads||0,recentUsers:recent.results||[]},200,origin);
    }

    if(u.pathname==="/api/admin/users"&&req.method==="GET"){
      const q=(u.searchParams.get("q")||"").trim();
      if(q) return json(await env.DB.prepare("SELECT id,name,email,role,created_at FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY created_at DESC").bind("%"+q+"%","%"+q+"%").all(),200,origin);
      return json(await env.DB.prepare("SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC LIMIT 200").all(),200,origin);
    }
    if(u.pathname.startsWith("/api/admin/users/")&&req.method==="PATCH"){
      const id=u.pathname.split("/").pop(),b=await body(req);
      if(id===user.id && b.role==="user")return json({error:"نمی‌توانید نقش خودتان را حذف کنید"},400,origin);
      const target=await env.DB.prepare("SELECT id FROM users WHERE id=?").bind(id).first();
      if(!target)return json({error:"کاربر پیدا نشد"},404,origin);
      if(b.role==="admin"||b.role==="user") await env.DB.prepare("UPDATE users SET role=? WHERE id=?").bind(b.role,id).run();
      if(b.name) await env.DB.prepare("UPDATE users SET name=? WHERE id=?").bind(String(b.name).trim(),id).run();
      return json({ok:true},200,origin);
    }
    if(u.pathname.startsWith("/api/admin/users/")&&req.method==="DELETE"){
      const id=u.pathname.split("/").pop();
      if(id===user.id)return json({error:"نمی‌توانید حساب خودتان را حذف کنید"},400,origin);
      await env.DB.prepare("DELETE FROM users WHERE id=?").bind(id).run();
      return json({ok:true},200,origin);
    }

    if(u.pathname==="/api/admin/mods"&&req.method==="GET") return json(await env.DB.prepare("SELECT * FROM mods ORDER BY created_at DESC").all(),200,origin);
    if(u.pathname==="/api/admin/mods"&&req.method==="POST"){
      const x=safeFields(await body(req)); if(!x.name)return json({error:"نام مود الزامی است"},400,origin);
      await saveMod(env,x); return json({ok:true,id:x.id},200,origin);
    }
    if(u.pathname.startsWith("/api/admin/mods/")&&req.method==="DELETE"){
      const id=u.pathname.split("/").pop(); await env.DB.prepare("DELETE FROM mods WHERE id=?").bind(id).run(); return json({ok:true},200,origin);
    }

    if(u.pathname==="/api/admin/packs"&&req.method==="GET") return json(await env.DB.prepare("SELECT * FROM packs ORDER BY created_at DESC").all(),200,origin);
    if(u.pathname==="/api/admin/packs"&&req.method==="POST"){
      const x=packFields(await body(req)); if(!x.name)return json({error:"نام پک الزامی است"},400,origin);
      await savePack(env,x); return json({ok:true,id:x.id},200,origin);
    }
    if(u.pathname.startsWith("/api/admin/packs/")&&req.method==="DELETE"){
      const id=u.pathname.split("/").pop(); await env.DB.prepare("DELETE FROM packs WHERE id=?").bind(id).run(); return json({ok:true},200,origin);
    }

    if(u.pathname==="/api/admin/sync-zargame"&&req.method==="POST"){
      const b=await body(req);if(!b.url)return json({error:"آدرس منبع را وارد کنید"},400,origin);
      const x=await zarSync(env,b.url); await saveMod(env,x);
      return json({ok:true,item:x},200,origin);
    }

    if(u.pathname==="/api/admin/categories"&&req.method==="GET")
      return json(await env.DB.prepare("SELECT * FROM categories ORDER BY sort_order").all(),200,origin);

    return json({error:"Not found"},404,origin);
  }catch(e){
    return json({error:e.message||"خطای سرور"},500,origin);
  }
 }
};
