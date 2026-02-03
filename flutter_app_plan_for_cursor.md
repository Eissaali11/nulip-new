# Flutter Technician App - Development Plan for Cursor

## Project Overview

Build a Flutter mobile application for technicians that mirrors the web application's technician features. The app will connect to an existing REST Express backend API.

**Backend Base URL:** `https://your-replit-app.replit.app`

---

## Tech Stack

- **Framework:** Flutter 3.x
- **State Management:** Riverpod 2.x
- **HTTP Client:** Dio with Retrofit
- **Local Storage:** flutter_secure_storage + Hive
- **Language:** Dart 3.x
- **Design:** Material 3 with RTL Arabic support

---

## Project Structure

```
lib/
├── main.dart
├── app.dart
│
├── core/
│   ├── api/
│   │   ├── api_client.dart
│   │   ├── api_endpoints.dart
│   │   └── interceptors/
│   │       ├── auth_interceptor.dart
│   │       └── error_interceptor.dart
│   ├── storage/
│   │   ├── secure_storage.dart
│   │   └── local_cache.dart
│   ├── theme/
│   │   ├── app_colors.dart
│   │   ├── app_theme.dart
│   │   └── text_styles.dart
│   ├── routing/
│   │   └── app_router.dart
│   └── utils/
│       ├── date_utils.dart
│       ├── validators.dart
│       └── extensions.dart
│
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── auth_repository.dart
│   │   │   └── models/
│   │   │       ├── user_model.dart
│   │   │       └── login_request.dart
│   │   ├── presentation/
│   │   │   ├── screens/
│   │   │   │   └── login_screen.dart
│   │   │   └── widgets/
│   │   │       └── login_form.dart
│   │   └── providers/
│   │       └── auth_provider.dart
│   │
│   ├── dashboard/
│   │   ├── data/
│   │   │   └── dashboard_repository.dart
│   │   ├── presentation/
│   │   │   ├── screens/
│   │   │   │   └── dashboard_screen.dart
│   │   │   └── widgets/
│   │   │       ├── stats_card.dart
│   │   │       ├── inventory_summary_card.dart
│   │   │       └── quick_actions.dart
│   │   └── providers/
│   │       └── dashboard_provider.dart
│   │
│   ├── fixed_inventory/
│   │   ├── data/
│   │   │   ├── fixed_inventory_repository.dart
│   │   │   └── models/
│   │   │       └── inventory_entry.dart
│   │   ├── presentation/
│   │   │   ├── screens/
│   │   │   │   └── fixed_inventory_screen.dart
│   │   │   └── widgets/
│   │   │       ├── inventory_list_tile.dart
│   │   │       └── transfer_bottom_sheet.dart
│   │   └── providers/
│   │       └── fixed_inventory_provider.dart
│   │
│   ├── moving_inventory/
│   │   ├── data/
│   │   │   ├── moving_inventory_repository.dart
│   │   │   └── models/
│   │   │       └── warehouse_transfer.dart
│   │   ├── presentation/
│   │   │   ├── screens/
│   │   │   │   └── moving_inventory_screen.dart
│   │   │   └── widgets/
│   │   │       ├── pending_transfer_card.dart
│   │   │       └── inventory_grid.dart
│   │   └── providers/
│   │       └── moving_inventory_provider.dart
│   │
│   ├── received_devices/
│   │   ├── data/
│   │   │   ├── devices_repository.dart
│   │   │   └── models/
│   │   │       └── received_device.dart
│   │   ├── presentation/
│   │   │   ├── screens/
│   │   │   │   └── submit_device_screen.dart
│   │   │   └── widgets/
│   │   │       ├── device_form.dart
│   │   │       └── sim_type_selector.dart
│   │   └── providers/
│   │       └── devices_provider.dart
│   │
│   ├── notifications/
│   │   ├── data/
│   │   │   └── notifications_repository.dart
│   │   ├── presentation/
│   │   │   ├── screens/
│   │   │   │   └── notifications_screen.dart
│   │   │   └── widgets/
│   │   │       └── notification_tile.dart
│   │   └── providers/
│   │       └── notifications_provider.dart
│   │
│   └── profile/
│       ├── presentation/
│       │   ├── screens/
│       │   │   └── profile_screen.dart
│       │   └── widgets/
│       │       └── user_info_card.dart
│       └── providers/
│           └── profile_provider.dart
│
└── shared/
    ├── models/
    │   ├── item_type.dart
    │   └── api_response.dart
    └── widgets/
        ├── app_scaffold.dart
        ├── loading_overlay.dart
        ├── error_view.dart
        ├── empty_state.dart
        └── bottom_navigation.dart
```

---

## API Endpoints Reference

### Authentication
```
POST /api/login
Body: { "username": string, "password": string }
Response: { "token": string, "user": User }

POST /api/logout
Headers: Authorization: Bearer <token>

GET /api/auth/user
Headers: Authorization: Bearer <token>
Response: User object
```

### Fixed Inventory
```
GET /api/technician-fixed-inventory/:technicianId
Response: FixedInventory object with legacy fields

GET /api/technicians/:technicianId/fixed-inventory-entries
Response: InventoryEntry[]

PUT /api/technicians/:technicianId/fixed-inventory-entries
Body: { entries: InventoryEntry[] }
```

### Moving Inventory
```
GET /api/technicians/:technicianId
Response: MovingInventory object

GET /api/technicians/:technicianId/moving-inventory-entries
Response: InventoryEntry[]

PUT /api/technicians/:technicianId/moving-inventory-entries
Body: { entries: InventoryEntry[] }
```

### Warehouse Transfers
```
GET /api/warehouse-transfers
Response: WarehouseTransfer[]

POST /api/warehouse-transfers/:transferId/accept
Response: { success: true }

POST /api/warehouse-transfers/:transferId/reject
Body: { reason?: string }
Response: { success: true }
```

### Received Devices
```
POST /api/received-devices
Body: {
  terminalId: string,
  serialNumber: string,
  battery: boolean,
  chargerCable: boolean,
  chargerHead: boolean,
  hasSim: boolean,
  simCardType: string | null,
  damagePart: string
}
```

### Item Types
```
GET /api/item-types/active
Response: ItemType[]
```

---

## Data Models

### User
```dart
class User {
  final String id;
  final String username;
  final String fullName;
  final String role; // "technician"
  final String? regionId;
  final String? city;
}
```

### InventoryEntry
```dart
class InventoryEntry {
  final String itemTypeId;
  final int boxes;
  final int units;
}
```

### ItemType
```dart
class ItemType {
  final String id;
  final String nameEn;
  final String nameAr;
  final String? iconName;
  final String? colorHex;
  final int sortOrder;
  final bool isActive;
  final bool isVisible;
}
```

### WarehouseTransfer
```dart
class WarehouseTransfer {
  final String id;
  final String warehouseId;
  final String warehouseName;
  final String technicianId;
  final String itemType;
  final String packagingType; // "boxes" | "units"
  final int quantity;
  final String status; // "pending" | "accepted" | "rejected"
  final String? notes;
  final String? rejectionReason;
  final DateTime createdAt;
}
```

### ReceivedDevice
```dart
class ReceivedDevice {
  final String terminalId;
  final String serialNumber;
  final bool battery;
  final bool chargerCable;
  final bool chargerHead;
  final bool hasSim;
  final String? simCardType;
  final String damagePart;
}
```

---

## Screens Implementation Details

### 1. Login Screen
- Username and password text fields
- Login button with loading state
- Error handling with snackbar
- Auto-login if token exists
- Arabic RTL layout

### 2. Dashboard Screen
- Welcome header with user name
- Stats cards: Total Fixed, Total Moving
- Quick action buttons: View Inventory, Submit Device
- Pending transfers count badge
- Pull-to-refresh

### 3. Fixed Inventory Screen
- List of inventory items with boxes/units
- Each item shows: icon, name, boxes count, units count
- Transfer to moving button per item
- Export to Excel floating action button
- Edit mode toggle

### 4. Moving Inventory Screen
- Pending transfers section at top (if any)
- Accept/Reject buttons for each pending transfer
- Current inventory grid
- Update inventory button
- Export to Excel

### 5. Submit Device Screen
- Form fields:
  - Terminal ID (text input)
  - Serial Number (text input with barcode scan button)
  - Battery checkbox
  - Charger Cable checkbox
  - Charger Head checkbox
  - Has SIM checkbox
  - SIM Type dropdown (if has SIM)
  - Damage Part textarea
- Submit button
- Success/Error feedback

### 6. Notifications Screen
- List of pending warehouse transfers
- Each item shows: warehouse name, item type, quantity, date
- Accept/Reject actions
- Rejection reason dialog

### 7. Profile Screen
- User avatar placeholder
- Full name
- Username
- Role badge
- Logout button with confirmation

---

## Theme Configuration

### Colors (matching web app)
```dart
class AppColors {
  static const primary = Color(0xFF18B2B0);
  static const primaryDark = Color(0xFF16A09E);
  static const background = Color(0xFFF8FAFC);
  static const backgroundDark = Color(0xFF0F172A);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceDark = Color(0xFF1E293B);
  static const error = Color(0xFFEF4444);
  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFF59E0B);
}
```

### Typography
```dart
// Use Cairo font for Arabic
GoogleFonts.cairo()
```

---

## State Management Pattern (Riverpod)

### Auth Provider Example
```dart
@riverpod
class Auth extends _$Auth {
  @override
  Future<User?> build() async {
    final token = await ref.read(secureStorageProvider).getToken();
    if (token == null) return null;
    return ref.read(authRepositoryProvider).getCurrentUser();
  }
  
  Future<void> login(String username, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final result = await ref.read(authRepositoryProvider).login(username, password);
      await ref.read(secureStorageProvider).saveToken(result.token);
      return result.user;
    });
  }
  
  Future<void> logout() async {
    await ref.read(secureStorageProvider).deleteToken();
    state = const AsyncData(null);
  }
}
```

---

## Key Implementation Notes

1. **RTL Support**: Set `locale: Locale('ar')` and wrap app with `Directionality.rtl`

2. **Token Storage**: Use `flutter_secure_storage` for storing auth tokens

3. **API Errors**: Handle 401 (redirect to login), 403, 404, 500 errors gracefully

4. **Offline Support**: Cache inventory data locally using Hive

5. **Pull to Refresh**: All list screens should support pull-to-refresh

6. **Loading States**: Show shimmer loading placeholders

7. **Empty States**: Show friendly empty state messages in Arabic

8. **Excel Export**: Use `excel` package and `share_plus` for sharing

9. **Barcode Scanner**: Use `mobile_scanner` for device serial numbers

10. **Form Validation**: Validate all inputs before submission

---

## pubspec.yaml Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3
  
  # Networking
  dio: ^5.4.0
  retrofit: ^4.0.3
  json_annotation: ^4.8.1
  
  # Storage
  flutter_secure_storage: ^9.0.0
  hive_flutter: ^1.1.0
  
  # UI Components
  google_fonts: ^6.1.0
  shimmer: ^3.0.0
  cached_network_image: ^3.3.1
  
  # Utilities
  intl: ^0.18.1
  excel: ^4.0.2
  share_plus: ^7.2.1
  mobile_scanner: ^3.5.6
  path_provider: ^2.1.2
  
  # Icons
  flutter_svg: ^2.0.9
  lucide_icons: ^0.257.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.8
  retrofit_generator: ^8.0.6
  riverpod_generator: ^2.3.9
  json_serializable: ^6.7.1
  hive_generator: ^2.0.1
```

---

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Project setup with folder structure
- [ ] Theme configuration (colors, fonts, RTL)
- [ ] Dio client with interceptors
- [ ] Secure storage setup
- [ ] Login screen and auth flow

### Phase 2: Core Screens (Week 2-3)
- [ ] Dashboard screen
- [ ] Fixed inventory screen with transfer
- [ ] Moving inventory screen
- [ ] Bottom navigation setup

### Phase 3: Features (Week 4)
- [ ] Submit device screen with form
- [ ] Notifications screen
- [ ] Accept/Reject transfer functionality
- [ ] Profile screen with logout

### Phase 4: Enhancements (Week 5)
- [ ] Excel export functionality
- [ ] Barcode scanner integration
- [ ] Offline caching
- [ ] Pull-to-refresh
- [ ] Loading/Error states polish

### Phase 5: Testing & Polish (Week 6)
- [ ] Unit tests for repositories
- [ ] Widget tests for screens
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Final UI polish

---

## Commands to Start

```bash
# Create new Flutter project
flutter create --org com.inventory technician_app

# Navigate to project
cd technician_app

# Add dependencies
flutter pub add flutter_riverpod dio flutter_secure_storage hive_flutter google_fonts shimmer excel share_plus mobile_scanner

# Add dev dependencies
flutter pub add --dev build_runner retrofit_generator riverpod_generator json_serializable

# Generate code (after adding annotations)
flutter pub run build_runner build --delete-conflicting-outputs

# Run app
flutter run
```

---

## Arabic Strings (Sample)

```dart
class AppStrings {
  static const appName = 'نظام إدارة المخزون';
  static const login = 'تسجيل الدخول';
  static const username = 'اسم المستخدم';
  static const password = 'كلمة المرور';
  static const dashboard = 'لوحة التحكم';
  static const fixedInventory = 'المخزون الثابت';
  static const movingInventory = 'المخزون المتحرك';
  static const notifications = 'الإشعارات';
  static const profile = 'الملف الشخصي';
  static const logout = 'تسجيل الخروج';
  static const boxes = 'كراتين';
  static const units = 'وحدات';
  static const total = 'الإجمالي';
  static const transfer = 'نقل';
  static const accept = 'قبول';
  static const reject = 'رفض';
  static const submit = 'إرسال';
  static const export = 'تصدير';
  static const loading = 'جاري التحميل...';
  static const error = 'حدث خطأ';
  static const success = 'تمت العملية بنجاح';
  static const noData = 'لا توجد بيانات';
  static const pendingTransfers = 'عمليات نقل معلقة';
  static const submitDevice = 'إدخال بيانات جهاز';
  static const terminalId = 'رقم الجهاز';
  static const serialNumber = 'الرقم التسلسلي';
  static const battery = 'بطارية';
  static const chargerCable = 'كابل الشاحن';
  static const chargerHead = 'رأس الشاحن';
  static const hasSim = 'يحتوي شريحة';
  static const simType = 'نوع الشريحة';
  static const damagePart = 'الجزء المتضرر';
  static const scanBarcode = 'مسح الباركود';
}
```

---

## Notes for Cursor AI

1. When generating screens, always include Arabic RTL text direction
2. Use the primary color #18B2B0 consistently
3. Follow the feature-first folder structure
4. Use Riverpod for all state management
5. Handle loading, error, and empty states for all async operations
6. Add form validation for all input fields
7. Use Cairo font from Google Fonts for Arabic text
8. Implement proper error handling with user-friendly Arabic messages
