# 100 Eşzamanlı Kullanıcı İçin Backend Ölçeklendirme Rehberi

Mevcut backend yapısı (`FastAPI` + `faster-whisper` + `ffmpeg`) tekil kullanıcılar veya düşük trafik için uygundur. Ancak 100 kişinin **aynı anda** işlem yapabilmesi için mimariyi değiştirmeniz ve güçlü bir donanım altyapısı kurmanız gerekir.

## 1. Mevcut Darboğazlar (Neden şu anki haliyle çalışmaz?)

1.  **GPU/CPU Kilitlemesi:** `transcribe` ve `export` işlemleri ağırdır. Bir kullanıcı 10 dakikalık bir videoyu işlerken, sunucu kaynaklarının (özellikle GPU VRAM ve CPU) büyük kısmını tüketir. 100 kişi aynı anda istek atarsa sunucu kilitlenir.
2.  **Senkron İşleyiş:** Şu anki kodda kullanıcı isteği gönderir ve işlem bitene kadar bekler (HTTP Timeout riski).
3.  **Disk I/O:** 100 videonun aynı anda yazılması/okunması disk hızını (IOPS) tüketir.

## 2. Önerilen Mimari: Asenkron Kuyruk Sistemi (Task Queue)

100 kullanıcıyı yönetmenin tek yolu, gelen istekleri bir **kuyruğa (Queue)** almak ve sırayla (veya paralel worker'larla) işlemektir.

**Yeni Akış Şöyle Olmalı:**
1.  **Frontend:** Videoyu yükler.
2.  **Backend (API):** Videoyu alır, diske/S3'e kaydeder, kuyruğa bir "İş Emri" (Task) ekler ve kullanıcıya bir `task_id` döner. (İşlem hemen yapılmaz!)
3.  **Message Broker (Redis):** İş emirlerini tutar.
4.  **Worker Sunucuları (Celery):** Kuyruktan işi alır, GPU üzerinde `Whisper` veya CPU üzerinde `FFmpeg` çalıştırır.
5.  **Frontend:** Belirli aralıklarla (Polling) `task_id` durumunu sorar ("Bitti mi?"). Bittiğinde sonucu indirir.

### Gerekli Teknolojiler:
*   **Kuyruk Yönetimi:** Redis veya RabbitMQ
*   **Worker Yönetimi:** Celery (Python)
*   **Depolama:** AWS S3, Google Cloud Storage veya MinIO (Lokal)

## 3. Sunucu ve Donanım Önerileri

100 eşzamanlı işlem çok yüksek bir güç gerektirir. İki senaryo vardır:

### Senaryo A: 100 Kişi "Aktif" (Ama aynı saniyede basmıyor)
*Kullanıcılar sisteme giriyor, dolanıyor, ara sıra işlem yapıyor.*
*   **Sunucu:** 1 adet Güçlü Dedicated Sunucu veya GPU Cloud Instance.
*   **Özellikler:**
    *   **GPU:** NVIDIA RTX 3090 / 4090 (24GB VRAM) veya A10G (Cloud için). *Whisper için VRAM kritiktir.*
    *   **CPU:** 16-32 Çekirdek (FFmpeg render işlemleri için).
    *   **RAM:** 64GB+
    *   **Disk:** 1TB+ NVMe SSD (Çok hızlı okuma/yazma için şart).

### Senaryo B: 100 Kişi "Aynı Anda" İşlem Başlatıyor
*Bu durumda tek sunucu yetmez, **Cluster** kurmalısınız.*
*   **Load Balancer:** İstekleri dağıtır.
*   **API Sunucusu:** Sadece dosya karşılar (CPU odaklı, ucuz).
*   **GPU Worker Havuzu:** 5-10 adet GPU sunucusu (Auto-scaling). Kuyruk doldukça yeni sunucu açılır.

## 4. Hangi Sunucu Sağlayıcısını Seçmeliyim?

| Sağlayıcı | Avantaj | Dezavantaj | Önerilen Tip |
| :--- | :--- | :--- | :--- |
| **Hetzner (Dedicated)** | En iyi Fiyat/Performans. Aylık sabit ücret. | GPU stok sorunu olabilir. Yönetimi size ait. | GEX44 (RTX 3080/4090 serisi) |
| **AWS (EC2)** | Sınırsız ölçekleme, profesyonel araçlar. | Çok pahalı. Trafik ücreti yüksek. | `g5.xlarge` veya `g4dn.2xlarge` |
| **RunPod / Vast.ai** | GPU kiralama üzerine kurulu, çok ucuz. | Enterprise değil, kesinti olabilir. | RTX 3090 / 4090 Instance |
| **DigitalOcean / Linode** | GPU desteği kısıtlı (H100 vs çok pahalı). | Video işleme için pahalıya gelir. | *Önerilmez* |

## 5. Maliyet Tahmini (Aylık)

*   **Başlangıç (Hetzner Dedicated):** ~150€ - 200€ / Ay (Tek sunucu, kuyruk sistemi ile 100 kişiyi sırayla yönetir).
*   **Profesyonel (AWS Auto-scaling):** ~1000$+ / Ay (Kullanıma göre değişir).

## 6. Ne Yapmalısınız? (Adım Adım)

1.  **Kodu Refactor Edin:** `main.py` içindeki işlemleri `Celery` task'larına bölün.
2.  **Redis Kurun:** İş kuyruğu için.
3.  **Dockerize Edin:** Uygulamayı `docker-compose` ile (API, Worker, Redis) paketleyin.
4.  **Sunucu Kiralayın:** Başlangıç için **Hetzner**'den GPU'lu bir sunucu veya **RunPod**'dan bir instance kiralayıp Docker'ı orada çalıştırın.

Bu yapı ile 100 kişi sisteme girdiğinde sunucunuz çökmez, sadece yoğunluğa göre işlem süreleri biraz uzar (kuyruk mantığı).
