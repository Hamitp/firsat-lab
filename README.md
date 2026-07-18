# Fırsat Lab

Çalışırken karşılaştığınız otomasyon ve yazılım fırsatlarını 30 saniyede yakalamak, puanlamak ve geliştirmek için hazırlanmış yerel MVP.

## Hızlı başlangıç

Windows'ta `BASLAT.bat` dosyasına çift tıklayın. İlk çalıştırmada gerekli bileşenler otomatik hazırlanır; ardından uygulama tarayıcınızda açılır.

Bilgisayarınızda güncel Node.js LTS sürümü bulunmalıdır. İlk hazırlık tamamlandıktan sonra uygulamayı yerel olarak kullanabilirsiniz.

## Neler var?

- Üç adımlı, 30 saniyelik hızlı fırsat yakalama
- Puanına göre sıralanan fırsat havuzu
- Arama, durum ve kategori filtreleri
- Beş ölçütlü fırsat puanlama
- Düzenlenebilir detay görünümü ve durum yönetimi
- Tarayıcı içinde otomatik yerel kayıt
- Tam JSON yedeği ve JSON'dan geri yükleme
- Excel uyumlu UTF-8 CSV dışa aktarma
- Obsidian uyumlu Markdown raporu
- Masaüstü ve mobil uyumlu, mikro animasyonlu arayüz

## Veriler nerede?

Kayıtlar yalnızca kullandığınız tarayıcının yerel depolama alanında tutulur. Tarayıcı verilerini temizlemeden önce uygulamadaki **Dışa aktar → JSON yedeği** seçeneğini kullanın.

## Geliştirici kullanımı

```text
npm install
npm run dev
```

Üretim kontrolü için `npm run build`, kod kalitesi kontrolü için `npm run lint` kullanılabilir.
