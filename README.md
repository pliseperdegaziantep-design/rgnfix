# RGNFIX Akıllı Ölçü ve Demonte Ürün Platformu

RGNFIX; plise perde danışmanı, ölçü asistanı, fiyat hesaplayıcı, kumaş karşılaştırma, renk danışmanı, montaj rehberi, bayi haritası ve sipariş akışını birleştiren yapay zekâ destekli demonte ürün platformudur.

## Teknoloji

- React 19 + Vite
- Express + tRPC
- Drizzle ORM + MySQL
- Tailwind CSS + Radix UI bileşenleri
- Opsiyonel AI, OAuth, harita ve depolama servisleri

## Bu paketle yapılan uygulama hazırlıkları

- Veritabanı bağlı değilken kumaş ve bayi sayfaları demo veriyle çalışır.
- AI anahtarı yokken danışman sayfası hata vermek yerine açıklayıcı demo yanıtı döner.
- Harita anahtarı yokken boş ekran yerine demo bilgilendirme alanı gösterilir.
- Görsel depolama proxy ayarı yokken SVG demo görseli döndürülür.
- Sipariş sayfası misafir siparişi destekler.
- Fiyat hesaplayıcıdan sipariş sayfasına aktarılan kumaş serisi otomatik eşleşir.
- `/api/health` sağlık kontrolü eklendi.
- `.env.example`, `Dockerfile`, `docker-compose.yml` ve Codex için `AGENTS.md` eklendi.

## Yerelde çalıştırma

Gerekenler:

- Node.js 22+
- pnpm 10+
- İsteğe bağlı: MySQL 8+

Kurulum:

```bash
cp .env.example .env
corepack enable
corepack prepare pnpm@10.4.1 --activate
pnpm install
pnpm dev
```

Uygulama varsayılan olarak şu adreste açılır:

```text
http://localhost:3000
```

## Veritabanı ile çalışma

Demo modunda `DATABASE_URL` boş bırakılabilir. Kalıcı sipariş, kullanıcı ve bayi kayıtları için MySQL bağlantısı tanımlayın:

```env
DATABASE_URL=mysql://rgn:rgn_password@127.0.0.1:3306/rgn_ai
```

Ardından migrasyonları çalıştırın:

```bash
pnpm db:push
```

## Docker ile çalışma

```bash
cp .env.example .env
docker compose up --build
```

İlk kurulumdan sonra veritabanı şemasını uygulamak için uygulama container’ında şu komutu çalıştırın:

```bash
docker compose exec app pnpm db:push
```

## Üretim build

```bash
pnpm build
pnpm start
```

## Ortam değişkenleri

| Değişken | Amaç | Zorunlu mu? |
| --- | --- | --- |
| `PORT` | Sunucu portu | Hayır |
| `DATABASE_URL` | MySQL bağlantısı | Sadece kalıcı veri için |
| `JWT_SECRET` | Oturum imzalama sırrı | OAuth kullanılıyorsa evet |
| `VITE_APP_ID` | OAuth uygulama kimliği | OAuth kullanılıyorsa evet |
| `VITE_OAUTH_PORTAL_URL` | OAuth giriş portalı | OAuth kullanılıyorsa evet |
| `OAUTH_SERVER_URL` | OAuth sunucu adresi | OAuth kullanılıyorsa evet |
| `OWNER_OPEN_ID` | Admin kullanıcı OpenID değeri | Hayır |
| `OPENAI_API_KEY` | RGNFIX AI danışmanı için sunucu tarafı OpenAI anahtarı | AI için önerilir |
| `OPENAI_MODEL` | Kullanılacak OpenAI modeli (varsayılan: `gpt-5.4-mini`) | Hayır |
| `OPENAI_API_URL` | OpenAI API kök adresi | Hayır |
| `BUILT_IN_FORGE_API_URL` | AI/depolama proxy servis adresi | AI/depolama için |
| `BUILT_IN_FORGE_API_KEY` | AI/depolama servis anahtarı | AI/depolama için |
| `VITE_FRONTEND_FORGE_API_URL` | Harita proxy adresi | Harita için |
| `VITE_FRONTEND_FORGE_API_KEY` | Harita proxy anahtarı | Harita için |

## Kontrol komutları

```bash
pnpm check
pnpm test
pnpm build
```

Not: Bu çalışma ortamında internet erişimi olmadığı için bağımlılık kurulumu ve build/test komutları çalıştırılamadı. Paket, mevcut `package.json` ve `pnpm-lock.yaml` üzerinden normal geliştirme ortamında kurulacak şekilde hazırlandı.
