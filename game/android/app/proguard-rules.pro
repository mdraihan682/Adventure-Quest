# Adventure Quest ProGuard Rules for Release Build

# Keep application classes
-keep class com.adventurequest.** { *; }

# Keep Google Play Services Ads
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# Keep Google Play Billing
-keep class com.android.billingclient.api.** { *; }
-dontwarn com.android.billingclient.api.**

# Keep WebView JavascriptInterface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class * implements android.webkit.JavascriptInterface { *; }

# Keep WebView classes
-keep class android.webkit.** { *; }
-dontwarn android.webkit.**

# Keep Kotlin coroutines
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# Keep AndroidX
-keep class androidx.** { *; }
-dontwarn androidx.**

# Keep JSON
-keep class org.json.** { *; }

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** wtf(...);
}

# Optimization
-optimizationpasses 5
-allowaccessmodification
-mergeinterfacesaggressively

# Keep source file names and line numbers for stack traces
-keepattributes SourceFile,LineNumberTable

# Keep annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes EnclosingMethod

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Parcelable
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
}

# Suppress warnings for internal APIs
-dontwarn java.lang.invoke.**
-dontwarn java.lang.module.**
-dontwarn kotlin.jvm.internal.**
-dontwarn okio.**
-dontwarn org.jetbrains.annotations.**

# Keep enum values
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep WebView callbacks
-keep class com.adventurequest.MainActivity$WebAppInterface { *; }

# Keep BuildConfig
-keep class com.adventurequest.BuildConfig { *; }