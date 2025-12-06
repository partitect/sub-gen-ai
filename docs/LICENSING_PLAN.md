# Subcio: Kullanıcı Yönetimi & Ücretlendirme Planı

> **Tarih:** 2025-12-07  
> **Durum:** Planlama aşamasında

---

## 📋 Özet

**Uygulama Tipi:** Yerel Electron desktop uygulaması (sunucu maliyeti yok)  
**Hedef Pazar:** Global  
**Önerilen Model:** Tek seferlik ödeme + LemonSqueezy

---

## 🏆 Benzer Uygulamalar Ne Yapıyor?

| Uygulama | Model | Fiyat | Notlar |
|----------|-------|-------|--------|
| **DaVinci Resolve Studio** | Tek seferlik | $295 | Ömür boyu + ücretsiz güncellemeler |
| **Final Cut Pro** | Tek seferlik | $300 | Apple ekosistemi |
| **Movavi Video Editor** | Tek seferlik | $55-150 | Lifetime veya 1 yıllık |
| **EZTitles** (profesyonel) | Tek seferlik | €1,620-2,380 | Kurumsal segment |
| **Wondershare Filmora** | Abonelik | $50/yıl veya $80 lifetime | Hibrit model |

**Sonuç:** Yerel işlem yapan desktop uygulamalar genellikle **tek seferlik ödeme** modelini kullanır.

---

## 🎯 Seçilen Model: Tek Seferlik Ödeme

### Fiyatlandırma

| Tier | Fiyat | Ne Dahil |
|------|-------|----------|
| Basic | $29 | Temel özellikler, 1 cihaz |
| **Pro** | **$49** | Tüm özellikler, 2 cihaz |
| Team | $99 | Tüm özellikler, 5 cihaz |

### Satış Platformu: LemonSqueezy

**Neden LemonSqueezy?**
- Türkiye'den global satış yapabilirsiniz
- Vergi işlemlerini onlar halleder (Merchant of Record)
- %5 + $0.50 komisyon
- Lisans anahtarı API'si var
- Web: [lemonsqueezy.com](https://lemonsqueezy.com)

---

## 🔐 Lisanslama Sistemi

### Makine ID Doğrulama (MAC adresi yerine)

**Bileşenler:**
- CPU model + çekirdek sayısı
- Toplam RAM miktarı  
- Disk seri numarası
- İşletim sistemi

> ⚠️ **Önemli:** MAC adresi kullanmayın! Kolayca değiştirilebilir.

### Akış

```
1. Kullanıcı satın alır → LemonSqueezy lisans anahtarı verir
2. Uygulamada anahtarı girer
3. Uygulama makine ID oluşturur
4. LemonSqueezy API'sine doğrulama isteği atar
5. Onay gelirse uygulama aktifleşir
```

---

## 📝 Implementasyon Adımları

### 1. LemonSqueezy Kurulumu (1 saat)
- [ ] Hesap oluştur: [lemonsqueezy.com](https://lemonsqueezy.com)
- [ ] Ürün oluştur (Subcio Pro - $49)
- [ ] "License Keys" özelliğini aktifle
- [ ] API key al

### 2. Electron'a Lisans Sistemi Ekle (2-4 saat)

```javascript
// Gerekli paket
// npm install node-machine-id

const { machineId } = require('node-machine-id');

async function validateLicense(licenseKey) {
  const deviceId = await machineId();
  
  const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      license_key: licenseKey,
      instance_name: deviceId
    })
  });
  
  return response.json();
}
```

### 3. UI Ekranları (2-4 saat)
- [ ] Lisans giriş ekranı
- [ ] Aktivasyon başarılı/başarısız mesajları
- [ ] "Pro'ya Yükselt" butonu

---

## 💰 Gelir Tahminleri

| Senaryo | Aylık Satış | Fiyat | Brüt Gelir | Net (~%11 komisyon) |
|---------|-------------|-------|------------|---------------------|
| Başlangıç | 10 adet | $49 | $490 | ~$435 |
| Orta | 50 adet | $49 | $2,450 | ~$2,175 |
| İyi | 100 adet | $49 | $4,900 | ~$4,350 |

---

## 🔄 Alternatif Model: Freemium

Eğer ileride değiştirmek isterseniz:

| Tier | Fiyat | Özellikler |
|------|-------|------------|
| Free | $0 | Watermark ile export, 5 dakika limit |
| Pro | $49 | Tam erişim, sınırsız |

---

## 📚 Kaynaklar

- [LemonSqueezy Docs](https://docs.lemonsqueezy.com)
- [LemonSqueezy License API](https://docs.lemonsqueezy.com/help/licensing)
- [node-machine-id](https://www.npmjs.com/package/node-machine-id)
