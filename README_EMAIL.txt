EXE PAK ULTIMATE PLUS

امکانات جدید این نسخه:
- مرکز ارسال ایمیل در پنل مدیریت
- ارسال به همه کاربران یا کاربران انتخاب‌شده
- تاریخچه ارسال ایمیل
- اعلان داخلی برای همه کاربران
- علاقه‌مندی پست‌ها
- امتیاز 1 تا 5 برای پست‌ها
- آمار امتیاز و علاقه‌مندی
- جداول جدید D1 به صورت خودکار ساخته می‌شوند
- امکانات قبلی EXE PAK حفظ شده‌اند

تنظیم ارسال ایمیل واقعی در Cloudflare:
1) یک حساب Resend بساز و دامنه فرستنده را Verify کن.
2) در Worker > Settings > Variables and Secrets یک Secret با نام RESEND_API_KEY بساز.
3) یک Variable با نام RESEND_FROM بساز، مثلا:
   EXE PAK <noreply@your-domain.com>
4) Worker را Deploy کن.

مهم:
- مقدار RESEND_API_KEY را داخل GitHub یا wrangler.toml قرار نده.
- دیتابیس D1 فعلی را حذف نکن.
- با اولین اجرای Worker، جدول‌های جدید خودکار ساخته می‌شوند.
