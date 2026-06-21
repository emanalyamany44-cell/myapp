# بناء APK لتطبيق DNS Lock عبر Capacitor

> ملاحظة مهمة: لا يمكن بناء APK داخل بيئة Lovable. يجب تصدير المشروع إلى GitHub ثم تنفيذ الخطوات على جهازك المحلي.

## المتطلبات (مرّة واحدة)

- **Node.js 20+** و **bun** أو **npm**
- **Android Studio** (Hedgehog أو أحدث) — https://developer.android.com/studio
- **JDK 17** (يأتي مع Android Studio)
- متغير البيئة `ANDROID_HOME` مُعدّ بشكل صحيح

## الخطوات

### 1. تصدير المشروع
من Lovable: زر **GitHub → Connect** ثم clone للمستودع محلياً.

### 2. تثبيت Capacitor
```bash
cd <مجلد-المشروع>
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 3. بناء الواجهة وإضافة Android
```bash
npm run build
npx cap add android
npx cap sync android
```

### 4. فتح Android Studio وبناء APK
```bash
npx cap open android
```
داخل Android Studio:
- انتظر حتى يكتمل Gradle Sync
- من القائمة العلوية: **Build → Build Bundle(s)/APK(s) → Build APK(s)**
- بعد الانتهاء انقر **locate** لفتح المجلد الذي يحوي `app-debug.apk`

ملف APK الناتج عادةً في:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 5. تثبيت على الهاتف
- فعّل **Developer options → USB debugging** على الهاتف
- وصّل الهاتف بالـ USB
- في Android Studio: انقر زر **Run ▶** أو انسخ الـ APK وثبّته يدوياً

## بناء نسخة Release (موقّعة)
1. أنشئ keystore: `keytool -genkey -v -keystore dnslock.jks -keyalg RSA -keysize 2048 -validity 10000 -alias dnslock`
2. في Android Studio: **Build → Generate Signed Bundle / APK**
3. اختر **APK** ثم اتبع المعالج

## تحديث التطبيق بعد أي تغيير في الواجهة
```bash
npm run build
npx cap sync android
```

## ⚠️ تنبيه حول وظيفة DNS
هذا تطبيق Capacitor يغلّف الواجهة فقط. التحكم الفعلي بـ DNS الجهاز يتطلب كتابة **Android VpnService** بـ Kotlin/Java داخل مجلد `android/` بعد إضافته، وتعريف صلاحيات `BIND_VPN_SERVICE` في `AndroidManifest.xml`. هذه خطوة برمجة Android أصلية خارج نطاق ما يولّده Capacitor تلقائياً.
