# 🌍 Oxy-Map

**Sürdürülebilir yaşam kararlarını destekleyen çevre dostu harita uygulaması**

---

## 🎯 Proje Genel Bakış

**Uygulama Adı:** OxyMap  
**Teknoloji Stack:** React.js + Next.js  
**Hedef:** UN Sürdürülebilir Kalkınma Hedefleri #11 (Sürdürülebilir Şehirler) ve #13 (İklim Eylemi)  
**Amaç:** Kullanıcılara çevresel farkındalık sağlayarak sürdürülebilir yaşam kararları almalarına yardımcı olmak.

---

## 🏗️ Temel Özellikler

### 1. 📊 Hava Kalitesi ve Sıcaklık Takibi

- Gerçek zamanlı hava kalitesi indeksi (AQI)
- Sıcaklık, nem, rüzgar hızı
- PM2.5, PM10, O₃, NO₂, SO₂ değerleri
- Risk seviyeleri (yeşil / sarı / kırmızı)
- Kişiselleştirilmiş sağlık önerileri

### 2. 🌳 Yeşil Alan Haritalama

- İnteraktif harita üzerinde yeşil alan gösterimi
- Mesafe filtresi (1 km, 2 km, 5 km, 10 km)
- Park, orman, bahçe, yeşil çatı gibi türler
- Navigasyon entegrasyonu

### 3. 🚗 Karbon Ayak İzi Optimizasyonlu Rota Planlama

- Yürüyüş, bisiklet, toplu taşıma, araba karşılaştırması
- CO₂ emisyon hesaplaması
- Alternatif rota önerileri
- Karbon tasarrufu göstergeleri

---

## 🔧 Kullanılan API'ler ve Paketler

### 🌐 Harita ve Konum

- 🗺️ **Maps JavaScript API** – Harita gösterimi ve interaktif navigasyon
- 📍 **Geocoding API** – Adres ↔ koordinat dönüşümleri
- 🚦 **Directions API** – Rota planlama ve navigasyon
- 🏞️ **Places API** – Yeşil alan ve önemli yerleri bulma

### 🌫️ Hava Kalitesi

- 🌬️ **Air Quality API** – AQI ve hava kirliliği değerleri

### 📦 Önemli Paketler

- ⚛️ **React 18+ / Next.js 14+** – Frontend framework ve SSR
- 🎨 **Tailwind CSS** – Modern UI tasarımı
- 🗺️ **Leaflet / MapBox GL JS** – Harita ve konum görselleştirme
- 📊 **Recharts** – Grafik ve veri görselleştirme
- 🧰 **Zustand / Redux Toolkit** – State management
- 📝 **React Hook Form / @hookform/resolvers** – Form yönetimi ve doğrulama
- 🎨 **@radix-ui/\* komponentleri** – UI elementleri (Accordion, Dialog, Tooltip, vs.)
- 🧪 **TypeScript** – Tip güvenliği
- 🔒 **@supabase/auth-helpers-nextjs / @supabase/supabase-js** – Kullanıcı kimlik doğrulama ve veri yönetimi
- 🗓️ **date-fns / react-day-picker** – Tarih ve takvim yönetimi

---

## 📱 Uygulama İşlevleri

1. **Ana Sayfa (Dashboard)** – Hava durumu özeti, hızlı AQI, günlük öneriler, yakın yeşil alanlar
2. **Hava Kalitesi Detay** – Saatlik / günlük grafikler, sağlık önerileri, geçmiş veriler
3. **Yeşil Alan Haritası** – Filtreleme, detay kartları, yol tarifi
4. **Rota Planlayıcı** – Emisyon karşılaştırması, alternatif rota önerileri
5. **Profil & Ayarlar** – Bildirimler, sağlık durumu, favori lokasyonlar

---

## ⚙️ Kurulum

```bash
# Depoyu klonla
git clone https://github.com/talhaceliktas/oxy-map.git

# Bağımlılıkları yükle
npm install

# Geliştirme modunda çalıştır
npm run dev

# .env.local dosyasını örnek dosyadan oluşturun
```
