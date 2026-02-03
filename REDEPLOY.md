# 🔄 إعادة رفع التطبيق على Hostinger

## 📋 معلومات السيرفر

- **IP**: `72.62.149.127`
- **Domain**: `stoc.fun`
- **User**: `stoc`
- **Path**: `/home/stoc/htdocs/stoc.fun`
- **Port**: `5000`

---

## 🚀 خطوات إعادة الرفع

### 1️⃣ الاتصال بالسيرفر

```bash
ssh stoc@srv1233279.hostinger.com
cd ~/htdocs/stoc.fun
```

---

### 2️⃣ سحب آخر التحديثات

```bash
# التحقق من حالة Git
git status

# سحب التحديثات
git pull origin main

# إذا كان هناك تعارضات، استخدم:
git fetch origin
git reset --hard origin/main
```

---

### 3️⃣ التحقق من ملف `.env`

```bash
# عرض محتوى .env
cat .env

# يجب أن يحتوي على:
# TRUST_PROXY=true
# NODE_ENV=production
# PORT=5000
# DATABASE_URL=...
# SESSION_SECRET=...
```

**إذا لم يكن موجوداً أو ناقصاً:**

```bash
nano .env
```

**أضف/تأكد من وجود:**
```env
TRUST_PROXY=true
NODE_ENV=production
PORT=5000
HTTPS=true
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key-here
```

---

### 4️⃣ تثبيت الحزم

```bash
# تثبيت الحزم (استخدم npm install إذا فشل npm ci)
npm install

# أو
npm ci
```

---

### 5️⃣ بناء التطبيق

```bash
npm run build
```

**انتظر حتى يكتمل البناء** (قد يستغرق 2-5 دقائق)

---

### 6️⃣ التحقق من قاعدة البيانات

```bash
# تطبيق التغييرات على قاعدة البيانات (إذا لزم الأمر)
npm run db:push

# إعادة تعيين كلمة مرور المدير (إذا لزم الأمر)
npx tsx scripts/reset-admin-password.ts
```

---

### 7️⃣ إعادة تشغيل PM2

```bash
# التحقق من حالة PM2
pm2 status

# إعادة تشغيل التطبيق
pm2 restart nulip-inventory

# إذا لم يكن التطبيق يعمل:
pm2 start ecosystem.config.cjs

# حفظ الإعدادات
pm2 save
```

---

### 8️⃣ التحقق من السجلات

```bash
# عرض آخر 50 سطر من السجلات
pm2 logs nulip-inventory --lines 50

# مراقبة السجلات في الوقت الفعلي
pm2 logs nulip-inventory
```

**اضغط `Ctrl+C` للخروج من المراقبة**

---

### 9️⃣ اختبار التطبيق محلياً

```bash
# اختبار API محلياً
curl http://localhost:5000/api/health

# اختبار تسجيل الدخول
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt -v
```

---

### 🔟 التحقق من Nginx

```bash
# التحقق من حالة Nginx
sudo systemctl status nginx

# إعادة تشغيل Nginx (إذا لزم الأمر)
sudo systemctl restart nginx

# التحقق من السجلات
sudo tail -f /var/log/nginx/error.log
```

---

## ✅ التحقق النهائي

### 1. من المتصفح:

افتح: `https://stoc.fun` أو `http://72.62.149.127`

### 2. تسجيل الدخول:

- **اسم المستخدم**: `admin`
- **كلمة المرور**: `admin123`

### 3. إذا استمرت المشاكل:

```bash
# فحص المنفذ
netstat -tulpn | grep 5000

# فحص PM2
pm2 status
pm2 logs nulip-inventory --lines 100

# فحص Nginx
sudo nginx -t
sudo systemctl status nginx
```

---

## 🆘 حل المشاكل الشائعة

### ❌ خطأ: "Process not found"

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

### ❌ خطأ: "Port 5000 already in use"

```bash
# إيجاد العملية التي تستخدم المنفذ
lsof -i :5000

# أو
netstat -tulpn | grep 5000

# إيقاف العملية
kill -9 <PID>
```

### ❌ خطأ: "Failed to fetch" عند تسجيل الدخول

1. **تحقق من `.env`**:
   ```bash
   cat .env | grep TRUST_PROXY
   # يجب أن يكون: TRUST_PROXY=true
   ```

2. **تحقق من Nginx**:
   ```bash
   sudo nginx -t
   ```

3. **أعد بناء التطبيق**:
   ```bash
   npm run build
   pm2 restart nulip-inventory
   ```

### ❌ خطأ: "ERR_EMPTY_RESPONSE"

1. **تحقق من PM2**:
   ```bash
   pm2 status
   pm2 logs nulip-inventory
   ```

2. **تحقق من Firewall**:
   - في Cloud Panel → Firewall
   - تأكد من فتح المنافذ 80 و 443

3. **تحقق من Nginx**:
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

---

## 📝 ملاحظات مهمة

1. **DNS**: تأكد من أن `stoc.fun` يشير إلى `72.62.149.127`
2. **SSL**: تأكد من وجود شهادة SSL صالحة في Cloud Panel
3. **Firewall**: تأكد من فتح المنافذ 80 و 443
4. **Backup**: قم بعمل نسخة احتياطية قبل التحديثات الكبيرة

---

## 🔄 سكربت سريع لإعادة الرفع

```bash
#!/bin/bash
cd ~/htdocs/stoc.fun
echo "🔄 Pulling updates..."
git pull origin main
echo "📦 Installing dependencies..."
npm install
echo "🔨 Building..."
npm run build
echo "🔄 Restarting PM2..."
pm2 restart nulip-inventory
echo "✅ Done!"
pm2 status
```

**حفظ السكربت:**
```bash
nano redeploy.sh
# الصق المحتوى أعلاه
chmod +x redeploy.sh
```

**استخدامه:**
```bash
./redeploy.sh
```

---

**✅ بعد إكمال جميع الخطوات، يجب أن يعمل التطبيق بشكل صحيح!**
