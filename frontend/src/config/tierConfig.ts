/**
 * Subcio Free Tier & Pro Feature Configuration
 * 
 * Bu dosya Free ve Pro kullanıcılar arasındaki farkları tanımlar.
 */

// =============================================================================
// FREE TIER LIMITS
// =============================================================================

export const FREE_TIER_LIMITS = {
    // Video süresi limiti (saniye cinsinden)
    maxVideoDuration: 180, // 3 dakika

    // Export kalitesi
    maxExportResolution: '720p',
    allowedResolutions: ['480p', '720p'],

    // Karaoke efektleri (sadece belirli efektler kullanılabilir)
    maxEffects: 5,
    allowedEffects: [
        'basic',
        'fade',
        'pop',
        'bounce',
        'highlight'
    ],

    // Export formatları
    allowedFormats: ['srt'],

    // Watermark
    showWatermark: true,
    watermarkText: 'Made with Subcio',
    watermarkPosition: 'bottom-right',

    // Diğer kısıtlamalar
    maxProjectsPerDay: 3,
    canUseAdvancedStyles: false,
    canUsePyonFXEffects: false,
};

// =============================================================================
// PRO TIER FEATURES
// =============================================================================

export const PRO_TIER_FEATURES = {
    // Video süresi limiti yok
    maxVideoDuration: Infinity,

    // Tüm export kaliteleri
    maxExportResolution: '4k',
    allowedResolutions: ['480p', '720p', '1080p', '4k'],

    // Tüm efektler
    maxEffects: Infinity,
    allowedEffects: 'all',

    // Tüm formatlar
    allowedFormats: ['srt', 'ass', 'vtt', 'sbv'],

    // Watermark yok
    showWatermark: false,
    watermarkText: null,

    // Sınırsız projeler
    maxProjectsPerDay: Infinity,
    canUseAdvancedStyles: true,
    canUsePyonFXEffects: true,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get current tier configuration based on license status
 */
export function getTierConfig(isPro: boolean) {
    return isPro ? PRO_TIER_FEATURES : FREE_TIER_LIMITS;
}

/**
 * Check if a specific effect is available
 */
export function isEffectAvailable(effectName: string, isPro: boolean): boolean {
    if (isPro) return true;
    return FREE_TIER_LIMITS.allowedEffects.includes(effectName);
}

/**
 * Check if a format is available
 */
export function isFormatAvailable(format: string, isPro: boolean): boolean {
    if (isPro) return true;
    return FREE_TIER_LIMITS.allowedFormats.includes(format.toLowerCase());
}

/**
 * Check if a resolution is available
 */
export function isResolutionAvailable(resolution: string, isPro: boolean): boolean {
    if (isPro) return true;
    return FREE_TIER_LIMITS.allowedResolutions.includes(resolution.toLowerCase());
}

/**
 * Check if video duration is within limit
 */
export function isVideoDurationAllowed(durationSeconds: number, isPro: boolean): boolean {
    if (isPro) return true;
    return durationSeconds <= FREE_TIER_LIMITS.maxVideoDuration;
}

/**
 * Get formatted duration limit text
 */
export function getDurationLimitText(isPro: boolean): string {
    if (isPro) return 'Sınırsız';
    const minutes = Math.floor(FREE_TIER_LIMITS.maxVideoDuration / 60);
    return `${minutes} dakika`;
}

// =============================================================================
// PRO FEATURE NAMES (for UI)
// =============================================================================

export const PRO_FEATURE_LABELS = {
    unlimitedDuration: 'Sınırsız Video Süresi',
    allEffects: '50+ Karaoke Efekti',
    allFormats: 'Tüm Export Formatları (ASS, SRT, VTT)',
    hdExport: '1080p/4K Export',
    noWatermark: 'Watermark Yok',
    advancedStyles: 'Gelişmiş Stil Editörü',
    pyonfxEffects: 'PyonFX Efektleri',
    prioritySupport: 'Öncelikli Destek',
};

// =============================================================================
// UPGRADE PROMPTS
// =============================================================================

export const UPGRADE_PROMPTS = {
    videoDuration: {
        title: 'Video Çok Uzun',
        message: `Free sürümde maksimum ${FREE_TIER_LIMITS.maxVideoDuration / 60} dakikalık videolar işlenebilir. Pro sürüme yükselterek sınırsız video işleyebilirsiniz.`,
        ctaText: 'Pro\'ya Yükselt',
    },
    effect: {
        title: 'Pro Efekt',
        message: 'Bu efekt sadece Pro sürümde kullanılabilir.',
        ctaText: 'Tüm Efektleri Aç',
    },
    format: {
        title: 'Pro Format',
        message: 'Bu export formatı sadece Pro sürümde kullanılabilir. Free sürümde sadece SRT formatı desteklenir.',
        ctaText: 'Tüm Formatları Aç',
    },
    resolution: {
        title: 'Yüksek Çözünürlük',
        message: 'Free sürümde maksimum 720p export yapılabilir. Pro sürüme yükselterek 1080p ve 4K export yapabilirsiniz.',
        ctaText: '4K Export Aç',
    },
    watermark: {
        title: 'Watermark Kaldır',
        message: 'Free sürümde tüm exportlara Subcio watermark\'ı eklenir. Pro sürümde watermark bulunmaz.',
        ctaText: 'Watermark\'ı Kaldır',
    },
};
