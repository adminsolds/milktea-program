package com.milktea.pos.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = PrimaryColor,
    onPrimary = Color.White,
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = PrimaryDark,
    secondary = SecondaryColor,
    onSecondary = Color.White,
    secondaryContainer = SecondaryContainer,
    onSecondaryContainer = SecondaryDark,
    tertiary = TertiaryColor,
    onTertiary = TextPrimaryLight,
    tertiaryContainer = TertiaryLight,
    onTertiaryContainer = TertiaryDark,
    background = BackgroundLight,
    onBackground = TextPrimaryLight,
    surface = SurfaceLight,
    onSurface = TextPrimaryLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = TextSecondaryLight,
    error = ErrorColor,
    onError = Color.White,
    errorContainer = ErrorLight,
    onErrorContainer = ErrorColor,
    outline = DividerLight,
    outlineVariant = DividerLight.copy(alpha = 0.5f),
    scrim = Color.Black.copy(alpha = 0.5f)
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryLight,
    onPrimary = TextPrimaryDark,
    primaryContainer = PrimaryDark,
    onPrimaryContainer = PrimaryLight,
    secondary = SecondaryLight,
    onSecondary = TextPrimaryDark,
    secondaryContainer = SecondaryDark,
    onSecondaryContainer = SecondaryLight,
    tertiary = TertiaryLight,
    onTertiary = TextPrimaryDark,
    tertiaryContainer = TertiaryDark,
    onTertiaryContainer = TertiaryLight,
    background = BackgroundDark,
    onBackground = TextPrimaryDark,
    surface = SurfaceDark,
    onSurface = TextPrimaryDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = TextSecondaryDark,
    error = ErrorColor,
    onError = TextPrimaryDark,
    errorContainer = ErrorColor.copy(alpha = 0.2f),
    onErrorContainer = ErrorLight,
    outline = DividerDark,
    outlineVariant = DividerDark.copy(alpha = 0.5f),
    scrim = Color.Black.copy(alpha = 0.7f)
)

@Composable
fun MilkTeaPOSTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            // 设置状态栏为透明，使用系统栏背景
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
            // 设置导航栏
            window.navigationBarColor = colorScheme.surface.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
