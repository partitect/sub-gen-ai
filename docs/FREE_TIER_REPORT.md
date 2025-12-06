# Free Tier Sistemi Raporu

**Tarih:** 2025-12-07  
**Durum:** ✅ Tamamlandı

---

## Özet

Subcio uygulaması için özellik kısıtlamalı Free Tier sistemi oluşturuldu. Bu sistem, kullanıcıların uygulamayı ücretsiz olarak denemesini sağlarken, gelişmiş özelliklerin Pro sürümle sınırlı kalmasını garanti eder.

---

## Free vs Pro Karşılaştırması

| Özellik | FREE | PRO |
|---------|------|-----|
| **Video süresi** | 3 dakika | Sınırsız |
| **Export kalitesi** | 720p | 1080p / 4K |
| **Karaoke efektleri** | 5 temel | 50+ hepsi |
| **Export formatları** | SRT | ASS / SRT / VTT / SBV |
| **Watermark** | ✅ Var | ❌ Yok |
| **Gelişmiş stiller** | ❌ | ✅ |
| **PyonFX efektleri** | ❌ | ✅ |
| **Günlük proje limiti** | 3 | Sınırsız |

---

## Oluşturulan Dosyalar

### 1. `src/config/tierConfig.ts`
Free ve Pro tier için tüm limitler ve yardımcı fonksiyonlar:

```typescript
FREE_TIER_LIMITS = {
  maxVideoDuration: 180, // 3 dk
  maxExportResolution: '720p',
  maxEffects: 5,
  allowedFormats: ['srt'],
  showWatermark: true,
}
```

### 2. `src/components/UpgradePrompt.tsx`
Pro'ya yükseltme dialog bileşeni:
- Pro özellikleri listesi
- Fiyat gösterimi ($49 tek seferlik)
- "Anahtarım Var" ve "Pro'ya Yükselt" butonları

### 3. `src/components/ProFeatures.tsx`
Kısıtlama bileşenleri:

| Bileşen | Açıklama |
|---------|----------|
| `ProGate` | İçeriği blur + kilit ile kaplar |
| `ProBadge` | "PRO" rozeti gösterir |
| `ProButton` | Tıklamada upgrade prompt açar |
| `useProFeature` | Hook: `requirePro()` fonksiyonu |

---

## Kullanım Örnekleri

### Pro Özelliği Kilitleme
```tsx
<ProGate feature="effect">
  <AdvancedKaraokeEffect />
</ProGate>
```

### Pro Rozeti
```tsx
<Button>
  4K Export <ProBadge />
</Button>
```

### Hook Kullanımı
```tsx
const { isPro, requirePro, UpgradeDialog } = useProFeature();

const handle4KExport = () => {
  requirePro('resolution', () => {
    // Pro ise burası çalışır
    export4K();
  });
};

return (
  <>
    <button onClick={handle4KExport}>Export 4K</button>
    <UpgradeDialog />
  </>
);
```

---

## Entegrasyon Noktaları

Aşağıdaki yerlere Pro kontrolü eklenmeli:

| Yer | Kısıtlama | Dosya |
|-----|-----------|-------|
| Efekt seçimi | 5 temel efekt | `PresetGallery.tsx` |
| Video yükleme | 3 dk limit | `UploadPage.tsx` |
| Export format | Sadece SRT | `ExportPage.tsx` |
| Export kalite | Max 720p | `ExportPage.tsx` |
| Watermark | Otomatik ekle | Backend `render_engine.py` |

---

## Sonraki Adımlar

1. [ ] Efekt seçiminde Pro kontrolü
2. [ ] Video süre kontrolü (upload sırasında)
3. [ ] Export sayfasında format/kalite kısıtlaması
4. [ ] Backend'de watermark ekleme
5. [ ] Test ve doğrulama
