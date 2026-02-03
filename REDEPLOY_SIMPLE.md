# 🔄 إعادة الرفع - خطوات سريعة

## 📝 الأوامر المطلوبة على السيرفر:

```bash
# 1. الاتصال
ssh stoc@srv1233279.hostinger.com
cd ~/htdocs/stoc.fun

# 2. سحب التحديثات
git pull origin main

# 3. تثبيت الحزم
npm install

# 4. بناء التطبيق
npm run build

# 5. إعادة تشغيل PM2
pm2 restart nulip-inventory

# 6. التحقق
pm2 status
pm2 logs nulip-inventory --lines 30
```

---

## ✅ التحقق من `.env`:

```bash
cat .env | grep TRUST_PROXY
```

**يجب أن يكون موجوداً:**
```
TRUST_PROXY=true
NODE_ENV=production
PORT=5000
```

---

## 🧪 الاختبار:

```bash
# اختبار محلي
curl http://localhost:5000/api/health

# من المتصفح
https://stoc.fun
```

---

**✅ انتهى!**
