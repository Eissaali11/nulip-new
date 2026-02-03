# 🔧 إصلاح إعدادات Nginx

## المشكلة الحالية:
إعدادات Nginx تستخدم `{{app_port}}` الذي قد لا يكون مضبوطاً بشكل صحيح.

## الحل:

### في Cloud Panel:
1. اذهب إلى **Sites** → **stoc.fun** → **Vhost**
2. استبدل `location /` بالتالي:

```nginx
location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Server $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_pass_request_headers on;
    proxy_max_temp_file_size 0;
    proxy_connect_timeout 900;
    proxy_send_timeout 900;
    proxy_read_timeout 900;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    proxy_temp_file_write_size 256k;
    proxy_cache_bypass $http_upgrade;
}

# إضافة location خاص للـ API (اختياري لكن موصى به)
location /api {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 900;
    proxy_send_timeout 900;
    proxy_read_timeout 900;
}
```

### التغييرات المهمة:
1. ✅ استبدال `{{app_port}}` بـ `5000` مباشرة
2. ✅ إزالة الـ trailing slash `/` من `proxy_pass` (من `http://127.0.0.1:{{app_port}}/` إلى `http://127.0.0.1:5000`)
3. ✅ إضافة `proxy_cache_bypass $http_upgrade;` لتحسين الأداء

### بعد التعديل:
```bash
# التحقق من صحة الإعدادات
sudo nginx -t

# إعادة تحميل Nginx
sudo systemctl reload nginx

# أو إعادة التشغيل الكامل
sudo systemctl restart nginx
```

---

## التحقق من أن Port 5000 مضبوط في Cloud Panel:

1. اذهب إلى **Sites** → **stoc.fun** → **Settings**
2. تحقق من **App Port** يجب أن يكون `5000`
3. إذا كان مختلفاً، غيّره إلى `5000` واحفظ

---

## اختبار بعد التعديل:

```bash
# اختبار محلي
curl http://localhost:5000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# اختبار من الخارج (من السيرفر نفسه)
curl https://stoc.fun/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

**بعد تطبيق هذه التغييرات، يجب أن يعمل تسجيل الدخول!**
