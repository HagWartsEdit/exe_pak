EXE PAK — نسخه Cloudflare

این نسخه ظاهر عمومی سایت را تمیز نگه می‌دارد و امکاناتی که به بک‌اند نیاز دارند را به Cloudflare Workers + D1 می‌سپارد.

امکانات:
- سایت گرافیکی و ریسپانسیو
- جستجو و دسته‌بندی
- ثبت‌نام و ورود واقعی
- پنل API مدیر
- آمار بازدید و دانلود
- ذخیره مودها/پک‌ها در D1
- ورود اطلاعات از لینک پست ZarGame از طریق Worker
- بدون نیاز به PHP روی سرور Rakhsh

مهم:
- این پروژه را لازم نیست روی Rakhsh به عنوان PHP اجرا کنی.
- Worker روی Cloudflare اجرا می‌شود و فایل‌های عمومی را هم می‌تواند سرو کند.
- اگر می‌خواهی ظاهر سایت همچنان روی Rakhsh بماند، فایل public/index.html را در سایتت بگذار و در بالای فایل مقدار API_BASE را برابر آدرس Worker کن.
- اگر کل سایت را روی Cloudflare Worker قرار بدهی، API_BASE خالی بماند.

راه‌اندازی:
1) در Cloudflare یک Worker جدید بساز.
2) با Wrangler این پروژه را deploy کن.
3) یک D1 Database با نام exe-pak-db بساز و schema.sql را اجرا کن.
4) شناسه D1 را در wrangler.toml جایگزین PASTE_D1_DATABASE_ID_HERE کن.
5) دو Secret بساز:
   JWT_SECRET = یک رشته تصادفی طولانی
   SETUP_SECRET = یک رشته تصادفی طولانی
6) deploy کن.
7) یک بار برای ساخت مدیر، این درخواست را بزن:
   POST https://YOUR-WORKER/api/admin/setup?secret=SETUP_SECRET
   Body:
   {"name":"Admin","email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}
   بعد از ساخته شدن اولین مدیر، این endpoint دیگر مدیر جدید نمی‌سازد.

برای تست API:
GET /api/public
POST /api/auth/register
POST /api/auth/login
POST /api/stats/view
POST /api/stats/download
POST /api/admin/sync-zargame  (نیازمند توکن مدیر)

همگام‌سازی ZarGame:
در پنل/ابزار خودت می‌توانی URL یک پست زرگیم مثل:
https://www.zargame.ir/post/4207
را به endpoint sync بدهی. Worker صفحه را از سمت سرور می‌خواند و عنوان، توضیح، تصویر و اولین لینک فایل zip/rar/7z را استخراج می‌کند.
این یک importer است، نه کپی کامل خودکار کل سایت زرگیم. برای crawl کامل و زمان‌بندی‌شده باید بعداً cron/صفحه‌بندی و قوانین دقیق‌تر اضافه شود.

نکته امنیتی:
- رمزها به صورت متن ساده ذخیره نمی‌شوند و با PBKDF2 هش می‌شوند.
- JWT با HMAC امضا می‌شود.
- SETUP_SECRET و JWT_SECRET را داخل Git یا فایل عمومی قرار نده.
- برای پنل مدیریت، احراز هویت واقعی فقط روی Worker انجام می‌شود.

اگر دامنه Worker را به عنوان API استفاده می‌کنی و سایت روی rakhsh-server.ir است، CORS را فقط برای دامنه خودت نگه دار.
