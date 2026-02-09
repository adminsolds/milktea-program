# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Keep model classes for Gson
-keep class com.milktea.pos.domain.model.** { *; }
-keep class com.milktea.pos.data.remote.** { *; }

# Retrofit
-keepattributes Signature
-keepattributes Exceptions
-keepattributes *Annotation*
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Gson
-keep class com.google.gson.** { *; }
-keep class sun.misc.Unsafe { *; }
-keep class com.google.gson.stream.** { *; }

# Room
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Hilt
-keep class * extends dagger.hilt.android.HiltAndroidApp { *; }
-keep class * extends android.app.Application { *; }

# USB Serial
-keep class com.hoho.android.usbserial.** { *; }

# ZXing
-dontwarn com.google.zxing.**

# Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepnames class kotlinx.coroutines.android.AndroidExceptionPreHandler {}
-keepnames class kotlinx.coroutines.android.AndroidDispatcherFactory {}

# Timber
-dontwarn timber.log.Timber

# General
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
