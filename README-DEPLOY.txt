EXE PAK V4 — Cloudflare Worker + D1

ویژگی‌ها:
- سایت عمومی EXE PAK
- ثبت‌نام و ورود
- پنل کاربری کامل: پروفایل، تغییر رمز، علاقه‌مندی‌ها، تاریخچه دانلود
- پنل مدیریت: داشبورد آمار، مدیریت مودها، پک‌ها، کاربران و ورود اطلاعات از منبع
- API امن با JWT/HMAC
- D1
- Static Assets

استقرار:
1) فایل‌ها را در ریشه GitHub repository قرار بده:
   public/
   src/
   schema.sql
   wrangler.toml
2) Worker را به GitHub متصل کن.
3) D1 را با نام exe-pak-db بساز و binding آن را DB قرار بده.
4) در Cloudflare دو Secret بساز:
   JWT_SECRET
   SETUP_SECRET
5) بعد از Deploy، /admin.html را باز کن و با SETUP_SECRET مدیر اصلی را فقط یک‌بار بساز.
6) سپس با حساب مدیر وارد پنل مدیریت شو.

نکته:
- پنل مدیریت لینک عمومی در سایت ندارد؛ آدرس آن /admin.html است.
- پنل کاربری /account.html است.
- جداول user_favorites و download_history اگر وجود نداشته باشند Worker آنها را خودکار می‌سازد.
