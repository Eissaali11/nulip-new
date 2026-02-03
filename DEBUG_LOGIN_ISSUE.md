# 🔍 تشخيص مشكلة "Failed to fetch" عند تسجيل الدخول

## الخطوة 1: التحقق من أن PM2 يعمل

نفّذ هذه الأوامر على السيرفر:

```bash
# 1. التحقق من حالة PM2
pm2 status

# إذا لم يكن هناك أي عملية، ابدأ التطبيق:
pm2 start ecosystem.config.cjs

# أو مباشرة:
pm2 start dist/index.js --name nulip-inventory --env production

# 2. حفظ الإعدادات
pm2 save

# 3. فحص السجلات
pm2 logs nulip-inventory --lines 50
```

**المتوقع:** يجب أن ترى `status: online` ورسالة `serving on port 5000`

---

## الخطوة 2: التحقق من أن التطبيق يعمل على المنفذ 5000

```bash
# فحص المنفذ
netstat -tulpn | grep 5000

# أو
ss -tulpn | grep 5000

# يجب أن ترى:
# tcp  0  0  127.0.0.1:5000  LISTEN  ...
```

---

## الخطوة 3: اختبار API محلياً

```bash
# اختبار تسجيل الدخول محلياً
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# يجب أن تحصل على response مثل:
# {"success":true,"user":{...},"token":"..."}
```

**إذا فشل هذا:** المشكلة في التطبيق نفسه، تحقق من السجلات.

---

## الخطوة 4: التحقق من إعدادات Nginx

في Cloud Panel:
1. اذهب إلى **Sites** → **stoc.fun** → **Vhost**
2. تأكد من وجود:

```nginx
location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

location /api {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

3. إعادة تحميل Nginx:
```bash
sudo systemctl reload nginx
```

---

## الخطوة 5: التحقق من ملف `.env`

```bash
cd /home/stoc/htdocs/stoc.fun
cat .env | grep -E "TRUST_PROXY|NODE_ENV|PORT|DATABASE_URL"

# يجب أن يحتوي على:
# TRUST_PROXY=true
# NODE_ENV=production
# PORT=5000
# DATABASE_URL=postgresql://...
```

إذا لم يكن `TRUST_PROXY=true` موجوداً:
```bash
echo "TRUST_PROXY=true" >> .env
pm2 restart nulip-inventory
```

---

## الخطوة 6: اختبار من المتصفح

افتح Developer Tools (F12) → Network tab، ثم جرب تسجيل الدخول.

**تحقق من:**
1. هل الطلب يذهب إلى `/api/auth/login`؟
2. ما هو Status Code؟
3. ما هي رسالة الخطأ في Response؟

---

## الخطوة 7: فحص سجلات Nginx

```bash
# سجلات الأخطاء
sudo tail -f /var/log/nginx/error.log

# سجلات الوصول
sudo tail -f /var/log/nginx/access.log
```

---

## الحلول السريعة:

### إذا كان PM2 لا يعمل:
```bash
pm2 delete all
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### إذا كان المنفذ 5000 مشغول:
```bash
# ابحث عن العملية التي تستخدم المنفذ
lsof -i :5000
# أو
fuser -k 5000/tcp
# ثم أعد تشغيل PM2
pm2 restart nulip-inventory
```

### إذا كان Nginx لا يعمل:
```bash
sudo systemctl status nginx
sudo systemctl restart nginx
```

---

## بعد كل خطوة، أعد المحاولة:
1. افتح: `https://stoc.fun`
2. جرب تسجيل الدخول
3. إذا استمرت المشكلة، انتقل للخطوة التالية

---

**أرسل نتائج كل خطوة لأتمكن من مساعدتك بشكل أفضل!**
