# 🔧 إصلاح خطأ تسجيل الدخول بعد الرفع

## ✅ التغييرات المطبقة:

### 1. إضافة TRUST_PROXY support
- تم إضافة `app.set('trust proxy', true)` عندما يكون `TRUST_PROXY=true` في `.env`
- هذا ضروري عندما يكون التطبيق خلف Nginx reverse proxy

### 2. إضافة CORS headers
- تم إضافة CORS headers يدوياً لدعم الطلبات من نفس النطاق
- يدعم `credentials: 'include'` للـ cookies والـ sessions

---

## 📋 خطوات التطبيق على السيرفر:

### 1. التأكد من ملف `.env` يحتوي على:
```bash
TRUST_PROXY=true
NODE_ENV=production
PORT=5000
```

### 2. رفع التحديثات:
```bash
cd /home/stoc/htdocs/stoc.fun
git pull origin main
npm ci
npm run build
pm2 restart nulip-inventory
```

### 3. التحقق من السجلات:
```bash
pm2 logs nulip-inventory --lines 50
```

### 4. اختبار تسجيل الدخول:
- افتح: `https://stoc.fun`
- جرب تسجيل الدخول

---

## 🔍 إذا استمرت المشكلة:

### تحقق من Nginx configuration:
```bash
# في Cloud Panel → Sites → stoc.fun → Vhost
# تأكد من وجود:
location /api {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### تحقق من SSL:
```bash
# في Cloud Panel → Sites → stoc.fun → SSL/TLS
# تأكد من تفعيل SSL certificate
```

### تحقق من Session cookie:
- في `server/config/session.ts`:
  - `secure: true` في الإنتاج (HTTPS)
  - `httpOnly: true`
  - `sameSite: 'lax'` أو `'none'` (إذا كان هناك cross-domain)

---

## 🐛 Debug Commands:

```bash
# اختبار API محلياً
curl http://localhost:5000/api/auth/me

# اختبار من السيرفر
curl https://stoc.fun/api/auth/me

# فحص PM2
pm2 status
pm2 logs nulip-inventory

# فحص Nginx
sudo nginx -t
sudo systemctl status nginx
```
