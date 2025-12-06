# Süper Admin Panel Gereksinimleri

**Tarih:** 2025-12-07  
**Öncelik:** 🟡 Orta

---

## Mevcut Durum

Electron'a geçmeden önce web uygulamasında bir admin arayüzü mevcuttu. Bu arayüz şunları yapabiliyordu:
- Presetleri listeleme, düzenleme, silme
- Yeni preset oluşturma
- Screenshot alma

**Şu an:** `PresetEditor.jsx` bileşeni (890 satır) mevcut ama uygulamaya entegre değil.

---

## Gerekli Özellikler

### 1. Admin Paneli Rotası
| Gereksinim | Açıklama |
|------------|----------|
| URL | `/admin` veya `/super-admin` |
| Erişim | Sadece Super Admin (machine ID veya özel key) |
| Koruma | Başka kullanıcılar erişemez |

### 2. Preset Yönetimi
| Özellik | Açıklama |
|---------|----------|
| Listeleme | Tüm presetleri grid/liste görünümü |
| Düzenleme | Stil parametrelerini değiştirme |
| Silme | Preset kaldırma (onay ile) |
| Yeni Ekleme | Boş preset oluşturma |
| Kopyalama | Mevcut preset'i kopyalama |
| Screenshot | Preset önizleme görüntüsü alma |
| Import/Export | JSON olarak içe/dışa aktarma |

### 3. Toplu İşlemler
| Özellik | Açıklama |
|---------|----------|
| Toplu silme | Birden fazla preset seçip silme |
| Kategori değiştirme | Seçili presetlerin kategorisini güncelleme |
| Export all | Tüm presetleri JSON olarak dışa aktarma |

---

## Teknik Uygulama Planı

### 1. Rota Ekleme (App.tsx)
```tsx
import AdminPage from './pages/AdminPage';

// Routes içine:
<Route path="/admin" element={<AdminPage />} />
```

### 2. Admin Erişim Kontrolü
```tsx
// AdminPage.tsx
const { isPro, licenseInfo } = useLicenseContext();

// Super Admin kontrolü
const isSuperAdmin = licenseInfo.isSuperAdmin;

if (!isSuperAdmin) {
  return <Navigate to="/" />;
}
```

### 3. Mevcut PresetEditor'ı Kullanma
`PresetEditor.jsx` zaten 890 satırlık kapsamlı bir bileşen. Şunları içeriyor:
- Preset listesi
- Canlı önizleme
- Font seçici
- Renk düzenleyici
- Efekt ayarları
- Screenshot fonksiyonu

### 4. Admin Menu Entry
Settings sayfasına Admin Panel linki:
```tsx
{isSuperAdmin && (
  <ListItem>
    <Button to="/admin">🔧 Admin Panel</Button>
  </ListItem>
)}
```

---

## Öncelik Sıralaması

| # | Özellik | Zorluk | Süre |
|---|---------|--------|------|
| 1 | Admin rotası + erişim kontrolü | Kolay | 30 dk |
| 2 | PresetEditor entegrasyonu | Kolay | 30 dk |
| 3 | Settings'e admin linki | Kolay | 15 dk |
| 4 | Toplu silme | Orta | 1 saat |
| 5 | Import/Export JSON | Orta | 1 saat |

**Toplam Tahmini Süre:** 3-4 saat

---

## Önerilen Arayüz Tasarımı

```
┌─────────────────────────────────────────────────────────┐
│  🔧 Subcio Admin Panel                    [← Dashboard] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [+ Yeni Preset] [📥 Import] [📤 Export] [🗑 Seçili Sil]│
│                                                         │
│  🔍 Ara...                    Kategori: [Tümü ▼]        │
│                                                         │
├───────────────────────┬─────────────────────────────────┤
│                       │                                 │
│  ┌─────┐ ┌─────┐     │     ┌─────────────────────┐    │
│  │basic│ │fade │     │     │   Canlı Önizleme    │    │
│  └─────┘ └─────┘     │     │                     │    │
│  ┌─────┐ ┌─────┐     │     │   "Sample Text"     │    │
│  │pop  │ │neon │     │     │                     │    │
│  └─────┘ └─────┘     │     └─────────────────────┘    │
│  ┌─────┐ ┌─────┐     │                                 │
│  │fire │ │glow │     │     Font: [Inter ▼]            │
│  └─────┘ └─────┘     │     Boyut: [48]                │
│                       │     Renk: 🟡 #FFD700           │
│  [50 preset]          │     ...                        │
│                       │                                 │
└───────────────────────┴─────────────────────────────────┘
```

---

## Sonraki Adımlar

1. [ ] AdminPage.tsx oluştur
2. [ ] Super Admin kontrolü ekle
3. [ ] PresetEditor'ı entegre et
4. [ ] Settings'e link ekle
5. [ ] Test et
