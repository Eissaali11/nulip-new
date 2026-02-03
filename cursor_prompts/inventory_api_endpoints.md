# 📡 API Endpoints لتطبيق Flutter - طلب وتحديث المخزون للفني

## 🌐 Base URL
```
https://fcf0121e-0593-4710-ad11-105d54ba692e-00-3cyb0wsnu78xa.janeway.replit.dev
```

## 🔐 Authentication Header
```
Authorization: Bearer <token>
```

---

# 📦 صفحة طلب المخزون للفني

## 1️⃣ إنشاء طلب مخزون جديد

### POST `/api/inventory-requests`

**الوصف:** إنشاء طلب مخزون جديد من الفني للمستودع

### Request Body:
```json
{
  "n950Boxes": 2,
  "n950Units": 5,
  "i9000sBoxes": 1,
  "i9000sUnits": 3,
  "i9100Boxes": 0,
  "i9100Units": 2,
  "rollPaperBoxes": 3,
  "rollPaperUnits": 0,
  "stickersBoxes": 1,
  "stickersUnits": 5,
  "newBatteriesBoxes": 0,
  "newBatteriesUnits": 10,
  "mobilySimBoxes": 0,
  "mobilySimUnits": 5,
  "stcSimBoxes": 0,
  "stcSimUnits": 3,
  "zainSimBoxes": 0,
  "zainSimUnits": 2,
  "notes": "طلب تعبئة مخزون شهري"
}
```

### Response (200):
```json
{
  "id": "uuid-string",
  "technicianId": "user-uuid",
  "n950Boxes": 2,
  "n950Units": 5,
  "i9000sBoxes": 1,
  "i9000sUnits": 3,
  "i9100Boxes": 0,
  "i9100Units": 2,
  "rollPaperBoxes": 3,
  "rollPaperUnits": 0,
  "stickersBoxes": 1,
  "stickersUnits": 5,
  "newBatteriesBoxes": 0,
  "newBatteriesUnits": 10,
  "mobilySimBoxes": 0,
  "mobilySimUnits": 5,
  "stcSimBoxes": 0,
  "stcSimUnits": 3,
  "zainSimBoxes": 0,
  "zainSimUnits": 2,
  "notes": "طلب تعبئة مخزون شهري",
  "status": "pending",
  "createdAt": "2025-02-03T10:30:00.000Z",
  "respondedAt": null,
  "respondedBy": null,
  "adminNotes": null,
  "warehouseId": null
}
```

### Dart Code:
```dart
Future<InventoryRequest> createInventoryRequest({
  int n950Boxes = 0,
  int n950Units = 0,
  int i9000sBoxes = 0,
  int i9000sUnits = 0,
  int i9100Boxes = 0,
  int i9100Units = 0,
  int rollPaperBoxes = 0,
  int rollPaperUnits = 0,
  int stickersBoxes = 0,
  int stickersUnits = 0,
  int newBatteriesBoxes = 0,
  int newBatteriesUnits = 0,
  int mobilySimBoxes = 0,
  int mobilySimUnits = 0,
  int stcSimBoxes = 0,
  int stcSimUnits = 0,
  int zainSimBoxes = 0,
  int zainSimUnits = 0,
  String? notes,
}) async {
  final response = await dio.post(
    '/api/inventory-requests',
    data: {
      'n950Boxes': n950Boxes,
      'n950Units': n950Units,
      'i9000sBoxes': i9000sBoxes,
      'i9000sUnits': i9000sUnits,
      'i9100Boxes': i9100Boxes,
      'i9100Units': i9100Units,
      'rollPaperBoxes': rollPaperBoxes,
      'rollPaperUnits': rollPaperUnits,
      'stickersBoxes': stickersBoxes,
      'stickersUnits': stickersUnits,
      'newBatteriesBoxes': newBatteriesBoxes,
      'newBatteriesUnits': newBatteriesUnits,
      'mobilySimBoxes': mobilySimBoxes,
      'mobilySimUnits': mobilySimUnits,
      'stcSimBoxes': stcSimBoxes,
      'stcSimUnits': stcSimUnits,
      'zainSimBoxes': zainSimBoxes,
      'zainSimUnits': zainSimUnits,
      if (notes != null) 'notes': notes,
    },
  );
  return InventoryRequest.fromJson(response.data);
}
```

---

## 2️⃣ الحصول على طلباتي

### GET `/api/inventory-requests/my`

**الوصف:** الحصول على جميع طلبات المخزون الخاصة بالفني الحالي

### Response (200):
```json
[
  {
    "id": "uuid-1",
    "technicianId": "user-uuid",
    "n950Boxes": 2,
    "n950Units": 5,
    "status": "pending",
    "createdAt": "2025-02-03T10:30:00.000Z",
    "notes": "طلب تعبئة مخزون شهري"
  },
  {
    "id": "uuid-2",
    "technicianId": "user-uuid",
    "n950Boxes": 1,
    "n950Units": 0,
    "status": "approved",
    "createdAt": "2025-02-01T08:00:00.000Z",
    "respondedAt": "2025-02-01T10:00:00.000Z",
    "adminNotes": "تمت الموافقة"
  },
  {
    "id": "uuid-3",
    "technicianId": "user-uuid",
    "n950Boxes": 5,
    "n950Units": 10,
    "status": "rejected",
    "createdAt": "2025-01-28T14:00:00.000Z",
    "respondedAt": "2025-01-28T16:00:00.000Z",
    "adminNotes": "الكمية المطلوبة غير متوفرة"
  }
]
```

### Dart Code:
```dart
Future<List<InventoryRequest>> getMyInventoryRequests() async {
  final response = await dio.get('/api/inventory-requests/my');
  return (response.data as List)
      .map((json) => InventoryRequest.fromJson(json))
      .toList();
}
```

---

## 3️⃣ الحصول على طلبات النقل المعلقة

### GET `/api/warehouse-transfers`

**الوصف:** الحصول على طلبات النقل من المستودع للفني (للقبول أو الرفض)

### Response (200):
```json
[
  {
    "id": "transfer-uuid-1",
    "warehouseId": "warehouse-uuid",
    "warehouseName": "مستودع جدة",
    "technicianId": "user-uuid",
    "technicianName": "محمد أحمد",
    "itemType": "n950",
    "packagingType": "boxes",
    "quantity": 5,
    "status": "pending",
    "performedBy": "supervisor-uuid",
    "performedByName": "المشرف أحمد",
    "notes": "تعبئة شهرية",
    "createdAt": "2025-02-03T09:00:00.000Z",
    "requestId": "request-uuid"
  },
  {
    "id": "transfer-uuid-2",
    "warehouseId": "warehouse-uuid",
    "warehouseName": "مستودع جدة",
    "technicianId": "user-uuid",
    "technicianName": "محمد أحمد",
    "itemType": "i9000s",
    "packagingType": "units",
    "quantity": 10,
    "status": "pending",
    "performedBy": "supervisor-uuid",
    "performedByName": "المشرف أحمد",
    "createdAt": "2025-02-03T09:00:00.000Z",
    "requestId": "request-uuid"
  }
]
```

### Dart Code:
```dart
Future<List<WarehouseTransfer>> getWarehouseTransfers() async {
  final response = await dio.get('/api/warehouse-transfers');
  return (response.data as List)
      .map((json) => WarehouseTransfer.fromJson(json))
      .toList();
}

// الحصول على الطلبات المعلقة فقط
Future<List<WarehouseTransfer>> getPendingTransfers() async {
  final transfers = await getWarehouseTransfers();
  return transfers.where((t) => t.status == 'pending').toList();
}
```

---

## 4️⃣ قبول طلب نقل

### POST `/api/warehouse-transfers/:id/accept`

**الوصف:** قبول طلب نقل من المستودع وإضافته للمخزون المتحرك

### Request:
```http
POST /api/warehouse-transfers/{transferId}/accept
Authorization: Bearer <token>
```

### Response (200):
```json
{
  "id": "transfer-uuid",
  "status": "accepted",
  "acceptedAt": "2025-02-03T11:00:00.000Z"
}
```

### Dart Code:
```dart
Future<void> acceptTransfer(String transferId) async {
  await dio.post('/api/warehouse-transfers/$transferId/accept');
}
```

---

## 5️⃣ رفض طلب نقل

### POST `/api/warehouse-transfers/:id/reject`

**الوصف:** رفض طلب نقل من المستودع

### Request:
```http
POST /api/warehouse-transfers/{transferId}/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "لا أحتاج هذه الكمية حالياً"
}
```

### Response (200):
```json
{
  "id": "transfer-uuid",
  "status": "rejected",
  "rejectedAt": "2025-02-03T11:00:00.000Z"
}
```

### Dart Code:
```dart
Future<void> rejectTransfer(String transferId, {String? reason}) async {
  await dio.post(
    '/api/warehouse-transfers/$transferId/reject',
    data: {
      if (reason != null) 'reason': reason,
    },
  );
}
```

---

## 6️⃣ قبول/رفض مجموعة طلبات

### POST `/api/warehouse-transfer-batches/by-ids/accept`

**الوصف:** قبول عدة طلبات نقل دفعة واحدة

### Request Body:
```json
{
  "transferIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

### Response (200):
```json
{
  "success": true,
  "acceptedCount": 3
}
```

### POST `/api/warehouse-transfer-batches/by-ids/reject`

**الوصف:** رفض عدة طلبات نقل دفعة واحدة

### Request Body:
```json
{
  "transferIds": ["uuid-1", "uuid-2", "uuid-3"],
  "reason": "السبب"
}
```

### Dart Code:
```dart
Future<void> acceptMultipleTransfers(List<String> transferIds) async {
  await dio.post(
    '/api/warehouse-transfer-batches/by-ids/accept',
    data: {'transferIds': transferIds},
  );
}

Future<void> rejectMultipleTransfers(List<String> transferIds, {String? reason}) async {
  await dio.post(
    '/api/warehouse-transfer-batches/by-ids/reject',
    data: {
      'transferIds': transferIds,
      if (reason != null) 'reason': reason,
    },
  );
}
```

---

# 🔄 صفحة تحديث المخزون للفني

## 1️⃣ الحصول على المخزون الثابت

### GET `/api/my-fixed-inventory`

**الوصف:** الحصول على المخزون الثابت للفني الحالي

### Response (200):
```json
{
  "id": "inventory-uuid",
  "technicianId": "user-uuid",
  "n950Boxes": 5,
  "n950Units": 12,
  "i9000sBoxes": 3,
  "i9000sUnits": 8,
  "i9100Boxes": 2,
  "i9100Units": 5,
  "rollPaperBoxes": 10,
  "rollPaperUnits": 20,
  "stickersBoxes": 4,
  "stickersUnits": 15,
  "newBatteriesBoxes": 2,
  "newBatteriesUnits": 10,
  "mobilySimBoxes": 1,
  "mobilySimUnits": 5,
  "stcSimBoxes": 1,
  "stcSimUnits": 3,
  "zainSimBoxes": 0,
  "zainSimUnits": 2,
  "entries": [
    {
      "itemTypeId": "n950",
      "boxes": 5,
      "units": 12
    }
  ],
  "updatedAt": "2025-02-03T10:00:00.000Z"
}
```

### Dart Code:
```dart
Future<TechnicianInventory?> getMyFixedInventory() async {
  final response = await dio.get('/api/my-fixed-inventory');
  if (response.data == null) return null;
  return TechnicianInventory.fromJson(response.data);
}
```

---

## 2️⃣ الحصول على المخزون المتحرك

### GET `/api/my-moving-inventory`

**الوصف:** الحصول على المخزون المتحرك للفني الحالي

### Response (200):
```json
{
  "id": "inventory-uuid",
  "technicianId": "user-uuid",
  "n950Boxes": 2,
  "n950Units": 5,
  "i9000sBoxes": 1,
  "i9000sUnits": 3,
  "i9100Boxes": 0,
  "i9100Units": 2,
  "rollPaperBoxes": 3,
  "rollPaperUnits": 5,
  "stickersBoxes": 1,
  "stickersUnits": 5,
  "newBatteriesBoxes": 0,
  "newBatteriesUnits": 5,
  "mobilySimBoxes": 0,
  "mobilySimUnits": 2,
  "stcSimBoxes": 0,
  "stcSimUnits": 1,
  "zainSimBoxes": 0,
  "zainSimUnits": 1,
  "entries": [],
  "updatedAt": "2025-02-03T11:00:00.000Z"
}
```

### Dart Code:
```dart
Future<TechnicianInventory?> getMyMovingInventory() async {
  final response = await dio.get('/api/my-moving-inventory');
  if (response.data == null) return null;
  return TechnicianInventory.fromJson(response.data);
}
```

---

## 3️⃣ نقل المخزون (من ثابت لمتحرك أو العكس)

### POST `/api/stock-transfer`

**الوصف:** نقل المخزون بين المخزون الثابت والمتحرك

### Request Body:
```json
{
  "technicianId": "user-uuid",
  "itemType": "n950",
  "packagingType": "box",
  "quantity": 2,
  "fromInventory": "fixed",
  "toInventory": "moving",
  "reason": "نقل للاستخدام اليومي",
  "notes": "ملاحظات إضافية"
}
```

**حقول الطلب:**
- `itemType`: نوع العنصر (`n950`, `i9000s`, `i9100`, `rollPaper`, `stickers`, `newBatteries`, `mobilySim`, `stcSim`, `zainSim`)
- `packagingType`: نوع التعبئة (`box`, `unit`)
- `fromInventory`: من أين (`fixed`, `moving`)
- `toInventory`: إلى أين (`fixed`, `moving`)

### Response (200):
```json
{
  "success": true,
  "message": "تم نقل المخزون بنجاح"
}
```

### Dart Code:
```dart
Future<void> transferStock({
  required String technicianId,
  required String itemType,
  required String packagingType, // 'box' or 'unit'
  required int quantity,
  required String fromInventory, // 'fixed' or 'moving'
  required String toInventory,   // 'fixed' or 'moving'
  String? reason,
  String? notes,
}) async {
  await dio.post(
    '/api/stock-transfer',
    data: {
      'technicianId': technicianId,
      'itemType': itemType,
      'packagingType': packagingType,
      'quantity': quantity,
      'fromInventory': fromInventory,
      'toInventory': toInventory,
      if (reason != null) 'reason': reason,
      if (notes != null) 'notes': notes,
    },
  );
}
```

---

## 4️⃣ الحصول على سجل حركات المخزون

### GET `/api/stock-movements`

**الوصف:** الحصول على سجل حركات المخزون للفني

### Response (200):
```json
[
  {
    "id": "movement-uuid",
    "technicianId": "user-uuid",
    "itemType": "n950",
    "packagingType": "box",
    "quantity": 2,
    "fromInventory": "fixed",
    "toInventory": "moving",
    "reason": "نقل للاستخدام اليومي",
    "createdAt": "2025-02-03T10:00:00.000Z"
  }
]
```

### Dart Code:
```dart
Future<List<StockMovement>> getStockMovements() async {
  final response = await dio.get('/api/stock-movements');
  return (response.data as List)
      .map((json) => StockMovement.fromJson(json))
      .toList();
}
```

---

## 5️⃣ الحصول على أنواع العناصر

### GET `/api/item-types/active`

**الوصف:** الحصول على أنواع العناصر النشطة في النظام

### Response (200):
```json
[
  {
    "id": "n950",
    "nameAr": "جهاز N950",
    "nameEn": "N950 Device",
    "iconName": "smartphone",
    "colorHex": "#3B82F6",
    "isActive": true,
    "isVisible": true,
    "unitsPerBox": 10,
    "sortOrder": 1
  },
  {
    "id": "i9000s",
    "nameAr": "جهاز I9000s",
    "nameEn": "I9000s Device",
    "iconName": "smartphone",
    "colorHex": "#10B981",
    "isActive": true,
    "isVisible": true,
    "unitsPerBox": 10,
    "sortOrder": 2
  },
  {
    "id": "rollPaper",
    "nameAr": "ورق حراري",
    "nameEn": "Roll Paper",
    "iconName": "file-text",
    "colorHex": "#F59E0B",
    "isActive": true,
    "isVisible": true,
    "unitsPerBox": 50,
    "sortOrder": 4
  }
]
```

### Dart Code:
```dart
Future<List<ItemType>> getActiveItemTypes() async {
  final response = await dio.get('/api/item-types/active');
  return (response.data as List)
      .map((json) => ItemType.fromJson(json))
      .toList();
}
```

---

# 📊 Data Models

```dart
// نموذج طلب المخزون
class InventoryRequest {
  final String id;
  final String technicianId;
  final int n950Boxes;
  final int n950Units;
  final int i9000sBoxes;
  final int i9000sUnits;
  final int i9100Boxes;
  final int i9100Units;
  final int rollPaperBoxes;
  final int rollPaperUnits;
  final int stickersBoxes;
  final int stickersUnits;
  final int newBatteriesBoxes;
  final int newBatteriesUnits;
  final int mobilySimBoxes;
  final int mobilySimUnits;
  final int stcSimBoxes;
  final int stcSimUnits;
  final int zainSimBoxes;
  final int zainSimUnits;
  final String? notes;
  final String status; // 'pending', 'approved', 'rejected'
  final DateTime createdAt;
  final DateTime? respondedAt;
  final String? respondedBy;
  final String? adminNotes;
  final String? warehouseId;

  InventoryRequest({
    required this.id,
    required this.technicianId,
    this.n950Boxes = 0,
    this.n950Units = 0,
    this.i9000sBoxes = 0,
    this.i9000sUnits = 0,
    this.i9100Boxes = 0,
    this.i9100Units = 0,
    this.rollPaperBoxes = 0,
    this.rollPaperUnits = 0,
    this.stickersBoxes = 0,
    this.stickersUnits = 0,
    this.newBatteriesBoxes = 0,
    this.newBatteriesUnits = 0,
    this.mobilySimBoxes = 0,
    this.mobilySimUnits = 0,
    this.stcSimBoxes = 0,
    this.stcSimUnits = 0,
    this.zainSimBoxes = 0,
    this.zainSimUnits = 0,
    this.notes,
    required this.status,
    required this.createdAt,
    this.respondedAt,
    this.respondedBy,
    this.adminNotes,
    this.warehouseId,
  });

  factory InventoryRequest.fromJson(Map<String, dynamic> json) {
    return InventoryRequest(
      id: json['id'],
      technicianId: json['technicianId'],
      n950Boxes: json['n950Boxes'] ?? 0,
      n950Units: json['n950Units'] ?? 0,
      i9000sBoxes: json['i9000sBoxes'] ?? 0,
      i9000sUnits: json['i9000sUnits'] ?? 0,
      i9100Boxes: json['i9100Boxes'] ?? 0,
      i9100Units: json['i9100Units'] ?? 0,
      rollPaperBoxes: json['rollPaperBoxes'] ?? 0,
      rollPaperUnits: json['rollPaperUnits'] ?? 0,
      stickersBoxes: json['stickersBoxes'] ?? 0,
      stickersUnits: json['stickersUnits'] ?? 0,
      newBatteriesBoxes: json['newBatteriesBoxes'] ?? 0,
      newBatteriesUnits: json['newBatteriesUnits'] ?? 0,
      mobilySimBoxes: json['mobilySimBoxes'] ?? 0,
      mobilySimUnits: json['mobilySimUnits'] ?? 0,
      stcSimBoxes: json['stcSimBoxes'] ?? 0,
      stcSimUnits: json['stcSimUnits'] ?? 0,
      zainSimBoxes: json['zainSimBoxes'] ?? 0,
      zainSimUnits: json['zainSimUnits'] ?? 0,
      notes: json['notes'],
      status: json['status'],
      createdAt: DateTime.parse(json['createdAt']),
      respondedAt: json['respondedAt'] != null 
          ? DateTime.parse(json['respondedAt']) 
          : null,
      respondedBy: json['respondedBy'],
      adminNotes: json['adminNotes'],
      warehouseId: json['warehouseId'],
    );
  }
}

// نموذج طلب النقل من المستودع
class WarehouseTransfer {
  final String id;
  final String warehouseId;
  final String? warehouseName;
  final String technicianId;
  final String? technicianName;
  final String itemType;
  final String packagingType;
  final int quantity;
  final String status; // 'pending', 'accepted', 'rejected'
  final String? performedBy;
  final String? performedByName;
  final String? notes;
  final DateTime createdAt;
  final String? requestId;

  WarehouseTransfer({
    required this.id,
    required this.warehouseId,
    this.warehouseName,
    required this.technicianId,
    this.technicianName,
    required this.itemType,
    required this.packagingType,
    required this.quantity,
    required this.status,
    this.performedBy,
    this.performedByName,
    this.notes,
    required this.createdAt,
    this.requestId,
  });

  factory WarehouseTransfer.fromJson(Map<String, dynamic> json) {
    return WarehouseTransfer(
      id: json['id'],
      warehouseId: json['warehouseId'],
      warehouseName: json['warehouseName'],
      technicianId: json['technicianId'],
      technicianName: json['technicianName'],
      itemType: json['itemType'],
      packagingType: json['packagingType'],
      quantity: json['quantity'],
      status: json['status'],
      performedBy: json['performedBy'],
      performedByName: json['performedByName'],
      notes: json['notes'],
      createdAt: DateTime.parse(json['createdAt']),
      requestId: json['requestId'],
    );
  }
}

// نموذج المخزون
class TechnicianInventory {
  final String id;
  final String technicianId;
  final int n950Boxes;
  final int n950Units;
  final int i9000sBoxes;
  final int i9000sUnits;
  final int i9100Boxes;
  final int i9100Units;
  final int rollPaperBoxes;
  final int rollPaperUnits;
  final int stickersBoxes;
  final int stickersUnits;
  final int newBatteriesBoxes;
  final int newBatteriesUnits;
  final int mobilySimBoxes;
  final int mobilySimUnits;
  final int stcSimBoxes;
  final int stcSimUnits;
  final int zainSimBoxes;
  final int zainSimUnits;
  final List<InventoryEntry>? entries;
  final DateTime? updatedAt;

  TechnicianInventory({
    required this.id,
    required this.technicianId,
    this.n950Boxes = 0,
    this.n950Units = 0,
    this.i9000sBoxes = 0,
    this.i9000sUnits = 0,
    this.i9100Boxes = 0,
    this.i9100Units = 0,
    this.rollPaperBoxes = 0,
    this.rollPaperUnits = 0,
    this.stickersBoxes = 0,
    this.stickersUnits = 0,
    this.newBatteriesBoxes = 0,
    this.newBatteriesUnits = 0,
    this.mobilySimBoxes = 0,
    this.mobilySimUnits = 0,
    this.stcSimBoxes = 0,
    this.stcSimUnits = 0,
    this.zainSimBoxes = 0,
    this.zainSimUnits = 0,
    this.entries,
    this.updatedAt,
  });

  int get totalItems {
    return n950Boxes + n950Units +
           i9000sBoxes + i9000sUnits +
           i9100Boxes + i9100Units +
           rollPaperBoxes + rollPaperUnits +
           stickersBoxes + stickersUnits +
           newBatteriesBoxes + newBatteriesUnits +
           mobilySimBoxes + mobilySimUnits +
           stcSimBoxes + stcSimUnits +
           zainSimBoxes + zainSimUnits;
  }

  factory TechnicianInventory.fromJson(Map<String, dynamic> json) {
    return TechnicianInventory(
      id: json['id'],
      technicianId: json['technicianId'],
      n950Boxes: json['n950Boxes'] ?? 0,
      n950Units: json['n950Units'] ?? 0,
      i9000sBoxes: json['i9000sBoxes'] ?? 0,
      i9000sUnits: json['i9000sUnits'] ?? 0,
      i9100Boxes: json['i9100Boxes'] ?? 0,
      i9100Units: json['i9100Units'] ?? 0,
      rollPaperBoxes: json['rollPaperBoxes'] ?? 0,
      rollPaperUnits: json['rollPaperUnits'] ?? 0,
      stickersBoxes: json['stickersBoxes'] ?? 0,
      stickersUnits: json['stickersUnits'] ?? 0,
      newBatteriesBoxes: json['newBatteriesBoxes'] ?? 0,
      newBatteriesUnits: json['newBatteriesUnits'] ?? 0,
      mobilySimBoxes: json['mobilySimBoxes'] ?? 0,
      mobilySimUnits: json['mobilySimUnits'] ?? 0,
      stcSimBoxes: json['stcSimBoxes'] ?? 0,
      stcSimUnits: json['stcSimUnits'] ?? 0,
      zainSimBoxes: json['zainSimBoxes'] ?? 0,
      zainSimUnits: json['zainSimUnits'] ?? 0,
      entries: json['entries'] != null
          ? (json['entries'] as List)
              .map((e) => InventoryEntry.fromJson(e))
              .toList()
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }
}

// نموذج عنصر المخزون
class InventoryEntry {
  final String itemTypeId;
  final int boxes;
  final int units;

  InventoryEntry({
    required this.itemTypeId,
    required this.boxes,
    required this.units,
  });

  int get total => boxes + units;

  factory InventoryEntry.fromJson(Map<String, dynamic> json) {
    return InventoryEntry(
      itemTypeId: json['itemTypeId'],
      boxes: json['boxes'] ?? 0,
      units: json['units'] ?? 0,
    );
  }
}

// نموذج نوع العنصر
class ItemType {
  final String id;
  final String nameAr;
  final String nameEn;
  final String? iconName;
  final String? colorHex;
  final bool isActive;
  final bool isVisible;
  final int? unitsPerBox;
  final int sortOrder;

  ItemType({
    required this.id,
    required this.nameAr,
    required this.nameEn,
    this.iconName,
    this.colorHex,
    required this.isActive,
    required this.isVisible,
    this.unitsPerBox,
    required this.sortOrder,
  });

  factory ItemType.fromJson(Map<String, dynamic> json) {
    return ItemType(
      id: json['id'],
      nameAr: json['nameAr'],
      nameEn: json['nameEn'],
      iconName: json['iconName'],
      colorHex: json['colorHex'],
      isActive: json['isActive'] ?? true,
      isVisible: json['isVisible'] ?? true,
      unitsPerBox: json['unitsPerBox'],
      sortOrder: json['sortOrder'] ?? 0,
    );
  }
}

// نموذج حركة المخزون
class StockMovement {
  final String id;
  final String technicianId;
  final String itemType;
  final String packagingType;
  final int quantity;
  final String fromInventory;
  final String toInventory;
  final String? reason;
  final String? notes;
  final DateTime createdAt;

  StockMovement({
    required this.id,
    required this.technicianId,
    required this.itemType,
    required this.packagingType,
    required this.quantity,
    required this.fromInventory,
    required this.toInventory,
    this.reason,
    this.notes,
    required this.createdAt,
  });

  factory StockMovement.fromJson(Map<String, dynamic> json) {
    return StockMovement(
      id: json['id'],
      technicianId: json['technicianId'],
      itemType: json['itemType'],
      packagingType: json['packagingType'],
      quantity: json['quantity'],
      fromInventory: json['fromInventory'],
      toInventory: json['toInventory'],
      reason: json['reason'],
      notes: json['notes'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
```

---

# 📋 جدول سريع

| الطريقة | Endpoint | الوصف |
|---------|----------|--------|
| `POST` | `/api/inventory-requests` | إنشاء طلب مخزون جديد |
| `GET` | `/api/inventory-requests/my` | الحصول على طلباتي |
| `GET` | `/api/warehouse-transfers` | الحصول على طلبات النقل |
| `POST` | `/api/warehouse-transfers/:id/accept` | قبول طلب نقل |
| `POST` | `/api/warehouse-transfers/:id/reject` | رفض طلب نقل |
| `GET` | `/api/my-fixed-inventory` | المخزون الثابت |
| `GET` | `/api/my-moving-inventory` | المخزون المتحرك |
| `POST` | `/api/stock-transfer` | نقل بين المخازن |
| `GET` | `/api/stock-movements` | سجل الحركات |
| `GET` | `/api/item-types/active` | أنواع العناصر |

---

# 🆕 النظام الديناميكي للأصناف (مُوصى به)

## مهم جداً للـ Flutter Developer:
النظام يدعم **أصناف ديناميكية** - أي صنف جديد يُضاف من لوحة الإدارة سيظهر تلقائياً في التطبيق **بدون تعديل الكود**

---

## 1️⃣ الحصول على أنواع الأصناف النشطة

### GET `/api/item-types/active` (بدون مصادقة)

**الوصف:** الحصول على جميع أنواع الأصناف النشطة لبناء الواجهة ديناميكياً

### Response (200):
```json
[
  {
    "id": "n950",
    "nameAr": "جهاز N950",
    "nameEn": "N950 Device",
    "iconName": "smartphone",
    "colorHex": "#3B82F6",
    "isActive": true,
    "isVisible": true,
    "unitsPerBox": 10,
    "sortOrder": 1
  },
  {
    "id": "new_item_xyz",
    "nameAr": "صنف جديد",
    "nameEn": "New Item XYZ",
    "iconName": "box",
    "colorHex": "#8B5CF6",
    "isActive": true,
    "isVisible": true,
    "unitsPerBox": 20,
    "sortOrder": 10
  }
]
```

### Dart Code:
```dart
Future<List<ItemType>> getActiveItemTypes() async {
  final response = await dio.get('/api/item-types/active');
  return (response.data as List)
      .map((json) => ItemType.fromJson(json))
      .toList();
}
```

---

## 2️⃣ الحصول على المخزون الثابت (ديناميكي)

### GET `/api/technicians/:technicianId/fixed-inventory-entries`

**الوصف:** الحصول على عناصر المخزون الثابت بشكل ديناميكي

### Response (200):
```json
[
  {
    "id": "entry-uuid-1",
    "technicianId": "user-uuid",
    "itemTypeId": "n950",
    "boxes": 5,
    "units": 12,
    "createdAt": "2025-02-03T10:00:00.000Z",
    "updatedAt": "2025-02-03T10:00:00.000Z"
  },
  {
    "id": "entry-uuid-2",
    "technicianId": "user-uuid",
    "itemTypeId": "new_item_xyz",
    "boxes": 3,
    "units": 8,
    "createdAt": "2025-02-03T10:00:00.000Z",
    "updatedAt": "2025-02-03T10:00:00.000Z"
  }
]
```

### Dart Code:
```dart
Future<List<DynamicInventoryEntry>> getFixedInventoryEntries(String technicianId) async {
  final response = await dio.get('/api/technicians/$technicianId/fixed-inventory-entries');
  return (response.data as List)
      .map((json) => DynamicInventoryEntry.fromJson(json))
      .toList();
}
```

---

## 3️⃣ الحصول على المخزون المتحرك (ديناميكي)

### GET `/api/technicians/:technicianId/moving-inventory-entries`

### Response (200):
```json
[
  {
    "id": "entry-uuid-1",
    "technicianId": "user-uuid",
    "itemTypeId": "n950",
    "boxes": 2,
    "units": 5,
    "createdAt": "2025-02-03T10:00:00.000Z",
    "updatedAt": "2025-02-03T10:00:00.000Z"
  }
]
```

### Dart Code:
```dart
Future<List<DynamicInventoryEntry>> getMovingInventoryEntries(String technicianId) async {
  final response = await dio.get('/api/technicians/$technicianId/moving-inventory-entries');
  return (response.data as List)
      .map((json) => DynamicInventoryEntry.fromJson(json))
      .toList();
}
```

---

## 4️⃣ إضافة/تحديث عنصر في المخزون الثابت

### POST `/api/technicians/:technicianId/fixed-inventory-entries`

**الوصف:** إضافة أو تحديث عنصر في المخزون الثابت

### Request Body:
```json
{
  "itemTypeId": "n950",
  "boxes": 5,
  "units": 12
}
```

### Response (200):
```json
{
  "id": "entry-uuid",
  "technicianId": "user-uuid",
  "itemTypeId": "n950",
  "boxes": 5,
  "units": 12,
  "createdAt": "2025-02-03T10:00:00.000Z",
  "updatedAt": "2025-02-03T10:00:00.000Z"
}
```

### Dart Code:
```dart
Future<DynamicInventoryEntry> upsertFixedInventoryEntry({
  required String technicianId,
  required String itemTypeId,
  required int boxes,
  required int units,
}) async {
  final response = await dio.post(
    '/api/technicians/$technicianId/fixed-inventory-entries',
    data: {
      'itemTypeId': itemTypeId,
      'boxes': boxes,
      'units': units,
    },
  );
  return DynamicInventoryEntry.fromJson(response.data);
}
```

---

## 5️⃣ إضافة/تحديث عنصر في المخزون المتحرك

### POST `/api/technicians/:technicianId/moving-inventory-entries`

**الوصف:** إضافة أو تحديث عنصر (يدعم عنصر واحد أو مجموعة)

### Request Body (عنصر واحد):
```json
{
  "itemTypeId": "n950",
  "boxes": 2,
  "units": 5
}
```

### Request Body (مجموعة عناصر):
```json
{
  "entries": [
    { "itemTypeId": "n950", "boxes": 2, "units": 5 },
    { "itemTypeId": "i9000s", "boxes": 1, "units": 3 },
    { "itemTypeId": "new_item_xyz", "boxes": 0, "units": 10 }
  ]
}
```

### Dart Code:
```dart
// إضافة عنصر واحد
Future<DynamicInventoryEntry> upsertMovingInventoryEntry({
  required String technicianId,
  required String itemTypeId,
  required int boxes,
  required int units,
}) async {
  final response = await dio.post(
    '/api/technicians/$technicianId/moving-inventory-entries',
    data: {
      'itemTypeId': itemTypeId,
      'boxes': boxes,
      'units': units,
    },
  );
  return DynamicInventoryEntry.fromJson(response.data);
}

// إضافة مجموعة عناصر (Batch)
Future<void> upsertMovingInventoryBatch({
  required String technicianId,
  required List<InventoryEntryInput> entries,
}) async {
  await dio.post(
    '/api/technicians/$technicianId/moving-inventory-entries',
    data: {
      'entries': entries.map((e) => e.toJson()).toList(),
    },
  );
}
```

---

## 📊 Data Models للنظام الديناميكي

```dart
// نموذج عنصر المخزون الديناميكي
class DynamicInventoryEntry {
  final String id;
  final String technicianId;
  final String itemTypeId;
  final int boxes;
  final int units;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  DynamicInventoryEntry({
    required this.id,
    required this.technicianId,
    required this.itemTypeId,
    required this.boxes,
    required this.units,
    this.createdAt,
    this.updatedAt,
  });

  int get total => boxes + units;

  factory DynamicInventoryEntry.fromJson(Map<String, dynamic> json) {
    return DynamicInventoryEntry(
      id: json['id'],
      technicianId: json['technicianId'],
      itemTypeId: json['itemTypeId'],
      boxes: json['boxes'] ?? 0,
      units: json['units'] ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }
}

// نموذج الإدخال للمخزون
class InventoryEntryInput {
  final String itemTypeId;
  final int boxes;
  final int units;

  InventoryEntryInput({
    required this.itemTypeId,
    required this.boxes,
    required this.units,
  });

  Map<String, dynamic> toJson() => {
    'itemTypeId': itemTypeId,
    'boxes': boxes,
    'units': units,
  };
}
```

---

## 🎯 كيفية بناء واجهة ديناميكية في Flutter

```dart
class InventoryScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // 1. جلب أنواع الأصناف من الـ API
    final itemTypesAsync = ref.watch(itemTypesProvider);
    
    // 2. جلب المخزون الحالي
    final inventoryAsync = ref.watch(myInventoryEntriesProvider);
    
    return itemTypesAsync.when(
      data: (itemTypes) => ListView.builder(
        itemCount: itemTypes.length,
        itemBuilder: (context, index) {
          final itemType = itemTypes[index];
          
          // 3. العثور على الكمية الحالية لهذا الصنف
          final entry = inventoryAsync.value?.firstWhere(
            (e) => e.itemTypeId == itemType.id,
            orElse: () => null,
          );
          
          return InventoryItemCard(
            itemType: itemType,
            boxes: entry?.boxes ?? 0,
            units: entry?.units ?? 0,
          );
        },
      ),
      loading: () => CircularProgressIndicator(),
      error: (e, s) => Text('خطأ: $e'),
    );
  }
}

// بطاقة صنف ديناميكية
class InventoryItemCard extends StatelessWidget {
  final ItemType itemType;
  final int boxes;
  final int units;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Color(int.parse(itemType.colorHex!.replaceFirst('#', '0xFF'))),
      child: ListTile(
        leading: Icon(_getIconByName(itemType.iconName)),
        title: Text(itemType.nameAr),
        subtitle: Text('صناديق: $boxes | وحدات: $units'),
      ),
    );
  }
  
  IconData _getIconByName(String? iconName) {
    switch (iconName) {
      case 'smartphone': return Icons.smartphone;
      case 'file-text': return Icons.description;
      case 'battery': return Icons.battery_full;
      case 'sim_card': return Icons.sim_card;
      default: return Icons.inventory_2;
    }
  }
}
```

---

## 📋 جدول مقارنة النظامين

| الميزة | النظام القديم | النظام الديناميكي ✅ |
|--------|--------------|---------------------|
| دعم أصناف جديدة | ❌ يتطلب تعديل الكود | ✅ تلقائي |
| الـ Endpoint | `/api/my-fixed-inventory` | `/api/technicians/:id/fixed-inventory-entries` |
| هيكل البيانات | حقول ثابتة (n950Boxes, etc) | `itemTypeId` + `boxes` + `units` |
| المرونة | ❌ محدودة | ✅ عالية |
| التوصية | للتوافق مع القديم | ✅ الاستخدام في الجديد |

---

# ⚠️ رموز الحالة

| الكود | المعنى |
|-------|--------|
| `200` | نجاح |
| `400` | بيانات غير صحيحة |
| `401` | غير مصرح (Token منتهي أو غير صحيح) |
| `403` | ممنوع (لا تملك الصلاحية) |
| `404` | غير موجود |
| `500` | خطأ في الخادم |
