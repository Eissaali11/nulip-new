# 🔧 إعدادات Nginx الكاملة لـ stoc.fun

## ⚠️ **مهم جداً:**
يجب نسخ **كامل** محتوى Vhost، وليس فقط `location /`

---

## 📋 **الإعدادات الكاملة:**

```nginx
server {
  listen 80;
  listen [::]:80;
  listen 443 quic;
  listen 443 ssl;
  listen [::]:443 quic;
  listen [::]:443 ssl;
  http2 on;
  http3 off;
  {{ssl_certificate_key}}
  {{ssl_certificate}}
  server_name www.stoc.fun;
  return 301 https://stoc.fun$request_uri;
}

server {
  listen 80;
  listen [::]:80;
  listen 443 quic;
  listen 443 ssl;
  listen [::]:443 quic;
  listen [::]:443 ssl;
  http2 on;
  http3 off;
  {{ssl_certificate_key}}
  {{ssl_certificate}}
  server_name stoc.fun www1.stoc.fun;
  {{root}}

  {{nginx_access_log}}
  {{nginx_error_log}}

  if ($scheme != "https") {
    rewrite ^ https://$host$request_uri permanent;
  }

  location ~ /.well-known {
    auth_basic off;
    allow all;
  }

  {{settings}}

  include /etc/nginx/global_settings;

  index index.html;

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
}
```

---

## ✅ **التغييرات المهمة:**

1. **استبدال** `proxy_pass http://127.0.0.1:{{app_port}}/;` 
   **بـ** `proxy_pass http://127.0.0.1:5000;`
   
   ⚠️ **ملاحظة:** إزالة الـ trailing slash `/` من النهاية!

2. **إضافة** `proxy_cache_bypass $http_upgrade;` في نهاية `location /`

---

## 🔍 **التحقق من الصيغة:**

بعد النسخ، في Cloud Panel:
1. اضغط **Save** أو **Update**
2. يجب أن يظهر: ✅ "Configuration saved successfully"

إذا ظهر خطأ:
- تأكد من نسخ **كامل** المحتوى
- تأكد من وجود `server {` في البداية و `}` في النهاية
- تأكد من أن `location /` داخل `server` block

---

## 🧪 **بعد الحفظ:**

```bash
# على السيرفر - التحقق من صحة الإعدادات
sudo nginx -t

# إذا كان صحيحاً، إعادة تحميل Nginx
sudo systemctl reload nginx
```

---

## 📝 **ملاحظات:**

- **لا تحذف** `{{ssl_certificate_key}}` و `{{ssl_certificate}}` - هذه متغيرات Cloud Panel
- **لا تحذف** `{{root}}` و `{{settings}}` - هذه أيضاً متغيرات Cloud Panel
- **لا تحذف** `{{nginx_access_log}}` و `{{nginx_error_log}}` - متغيرات Cloud Panel

**التغيير الوحيد:** استبدال `{{app_port}}` بـ `5000` وإزالة `/` من نهاية `proxy_pass`
