# 🔧 إصلاح خطأ ERR_EMPTY_RESPONSE

## المشكلة:
السيرفر لا يرد على الطلبات - `ERR_EMPTY_RESPONSE`

## التشخيص:

### 1. التحقق من PM2:
```bash
pm2 status
pm2 logs --lines 30
```

### 2. التحقق من المنفذ 5000:
```bash
netstat -tulpn | grep 5000
# أو
ss -tulpn | grep 5000
```

### 3. اختبار API محلياً:
```bash
curl http://localhost:5000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 4. التحقق من Firewall:
```bash
# في Cloud Panel → Firewall
# تأكد من أن ports 80 و 443 مفتوحة
```

---

## الحلول:

### الحل 1: إعادة تشغيل PM2
```bash
pm2 restart nulip-inventory
pm2 logs --lines 20
```

### الحل 2: التحقق من ملف .env
```bash
cat .env | grep -E "PORT|NODE_ENV|DATABASE_URL"
```

### الحل 3: التحقق من Nginx
```bash
# في Cloud Panel → Sites → stoc.fun → Vhost
# تأكد من أن proxy_pass يشير إلى http://127.0.0.1:5000
```

### الحل 4: إعادة تشغيل Nginx (من Cloud Panel)
- Sites → stoc.fun → Actions → Reload Nginx

---

## إذا استمرت المشكلة:

### فحص السجلات:
```bash
pm2 logs --lines 50
cat logs/error-0.log
cat logs/output-0.log
```

### التحقق من قاعدة البيانات:
```bash
# اختبار الاتصال
psql -U nulip_user -d nulip_inventory -h localhost -c "SELECT 1;"
```

---

**نفّذ الأوامر أعلاه وأرسل النتائج!**
