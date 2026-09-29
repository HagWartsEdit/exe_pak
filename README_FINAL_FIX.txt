EXE PAK FINAL SERVER FIX

این نسخه برای خطای «خطای سرور» آماده شده است.

اصلاحات اصلی:
- ساخت امن جدول‌های پایه قبل از migration
- اضافه شدن امن role / upload_approved / pack_maker / best_approved / last_seen
- حذف DEFAULT(datetime('now')) از ALTER TABLE و استفاده از مقدار ثابت
- آماده‌سازی users/posts/messages/site_stats
- ثبت خطای واقعی در Cloudflare Logs با console.error
- سیستم تأیید آپلود و مدیریت کاربران حفظ شده است

Deploy:
1) محتوای این ZIP را جایگزین فایل‌های repo کن.
2) در Cloudflare Workers Deploy بزن.
3) اگر هنوز خطا دیدی، Cloudflare > Worker > Logs را باز کن؛ خطای واقعی با EXE_PAK_SERVER_ERROR ثبت می‌شود.
