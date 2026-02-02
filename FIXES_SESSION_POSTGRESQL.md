# 🔐 حل مشكلة انتهاء صلاحية الجلسات (Session Expired)

## المشكلة الأصلية

عند استخدام صفحة النقل من المستودع إلى الفني، كان المستخدمون يحصلون على خطأ:
```
{"message":"Session expired"} :401
```

**السبب:**
- النظام كان يستخدم **Memory Session Store** (MemoryStore)
- عند إعادة تشغيل الخادم (`npm run dev`), تُفقد جميع الجلسات النشطة
- المستخدمون مضطرون لإعادة تسجيل الدخول بعد كل إعادة تشغيل

---

## الحل المُطبق

### 1️⃣ تثبيت `connect-pg-simple`

```bash
npm install connect-pg-simple
```

هذه المكتبة تتيح حفظ الجلسات في قاعدة بيانات PostgreSQL بدلاً من الذاكرة.

---

### 2️⃣ تحديث `server/config/session.ts`

**قبل:**
```typescript
// Use memory store
const SessionStore = session.MemoryStore;
sessionConfig.store = new SessionStore();
logger.info("Using memory session store", { source: "session" });
```

**بعد:**
```typescript
import connectPgSimple from "connect-pg-simple";

// Initialize PostgreSQL session store
const PgSession = connectPgSimple(session);

sessionConfig.store = new PgSession({
  pool: pool, // استخدام connection pool الموجود
  tableName: "session", // اسم الجدول في قاعدة البيانات
  createTableIfMissing: true, // إنشاء الجدول تلقائياً
  pruneSessionInterval: 60 * 15, // حذف الجلسات المنتهية كل 15 دقيقة
});

logger.info("Using PostgreSQL session store with auto-table creation", { 
  source: "session" 
});
```

---

### 3️⃣ زيادة مدة الجلسة

```typescript
cookie: {
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام (بدلاً من 24 ساعة)
}
```

---

## النتيجة

### ✅ الفوائد

| الميزة | قبل | بعد |
|--------|-----|-----|
| **حفظ الجلسات** | ❌ في الذاكرة (RAM) | ✅ في PostgreSQL |
| **إعادة التشغيل** | ❌ تُفقد جميع الجلسات | ✅ الجلسات محفوظة |
| **الاستمرارية** | ❌ Session Expired عند Restart | ✅ المستخدمون يبقون مسجلين |
| **مدة الجلسة** | ⏱️ 24 ساعة | ⏱️ 7 أيام |
| **الإنتاج** | ❌ غير جاهز | ✅ Production Ready |

---

### 📊 هيكل جدول `session` في PostgreSQL

يتم إنشاء الجدول تلقائياً بالهيكل التالي:

```sql
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" 
  PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```

**الحقول:**
- `sid`: معرّف الجلسة (Session ID)
- `sess`: بيانات الجلسة بصيغة JSON (userId, username, role, etc.)
- `expire`: تاريخ انتهاء الجلسة

---

## 🔧 الإعدادات التقنية

### التنظيف التلقائي
```typescript
pruneSessionInterval: 60 * 15 // كل 15 دقيقة
```
- يقوم النظام بحذف الجلسات المنتهية تلقائياً كل 15 دقيقة
- لا يتراكم جدول `session` بجلسات قديمة

### الأمان
```typescript
cookie: {
  secure: process.env.NODE_ENV === "production", // HTTPS فقط في الإنتاج
  httpOnly: true, // منع JavaScript من قراءة الـ Cookie
}
```

---

## 🧪 التحقق من الحل

### 1. التحقق من سجلات الخادم
عند تشغيل `npm run dev`, يجب أن ترى:
```
[session] [INFO] Using PostgreSQL session store with auto-table creation
```

### 2. التحقق من قاعدة البيانات
```sql
SELECT * FROM session;
```
يجب أن ترى الجلسات النشطة محفوظة.

### 3. اختبار إعادة التشغيل
1. سجل الدخول إلى النظام
2. أوقف الخادم (`Ctrl+C`)
3. أعد تشغيل الخادم (`npm run dev`)
4. افتح المتصفح - يجب أن تكون لا تزال مسجلاً دون الحاجة لإعادة الدخول

---

## 📚 مصادر إضافية

- [connect-pg-simple Documentation](https://github.com/voxpelli/node-connect-pg-simple)
- [Express Session Best Practices](https://github.com/expressjs/session#compatible-session-stores)

---

## 🎯 الخلاصة

تم تحويل النظام من **Memory Session Store** (مؤقت) إلى **PostgreSQL Session Store** (دائم)، مما يحل مشكلة `Session expired` ويجعل النظام جاهزاً للإنتاج.

**التاريخ:** 2026-02-02  
**الحالة:** ✅ مُطبّق بنجاح
