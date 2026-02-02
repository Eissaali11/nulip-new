# 🔧 إصلاح خطأ تسجيل الدخول "Failed to fetch"

## المشكلة
بعد رفع التطبيق على السيرفر، يظهر خطأ "Failed to fetch" عند محاولة تسجيل الدخول.

## الحل

### الخطوة 1: تحديث الكود من GitHub
```bash
cd /home/stoc/htdocs/stoc.fun
git pull origin main
```

### الخطوة 2: التحقق من متغيرات البيئة
```bash
# فتح ملف .env
nano .env

# التأكد من وجود هذه المتغيرات:
TRUST_PROXY=true
NODE_ENV=production
HTTPS=true
PORT=5000
DATABASE_URL=postgresql://...
SESSION_SECRET=...
```

### الخطوة 3: إعادة بناء التطبيق
```bash
npm ci
npm run build
```

### الخطوة 4: إعادة تشغيل PM2
```bash
pm2 restart nulip-inventory
pm2 save
```

### الخطوة 5: فحص السجلات
```bash
pm2 logs nulip-inventory --lines 50
```

### الخطوة 6: التحقق من إعدادات Nginx
```bash
# فتح ملف إعدادات Nginx
sudo nano /etc/nginx/sites-available/stoc.fun

# التأكد من وجود هذه الإعدادات في location /:
location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

# إعادة تحميل Nginx
sudo systemctl reload nginx
```

## التحقق من الحل

1. افتح المتصفح: `https://stoc.fun`
2. جرب تسجيل الدخول
3. افتح Developer Tools (F12) → Network tab
4. تحقق من أن الطلبات تذهب إلى `/api/auth/login` بنجاح

## إذا استمرت المشكلة

### فحص الاتصال المحلي
```bash
curl http://localhost:5000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### فحص المنفذ
```bash
netstat -tlnp | grep 5000
```

### إعادة تشغيل كامل
```bash
pm2 delete nulip-inventory
pm2 start ecosystem.config.cjs
pm2 save
```

---

*آخر تحديث: 2026-02-03*
