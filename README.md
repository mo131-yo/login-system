# Login System

Имэйл+нууц үг болон Google-ээр нэвтрэх/бүртгүүлэх боломжтой, admin эрхийн ялгаатай, нууц үг сэргээх функцтэй, дахин ашиглаж болохоор бүтээгдсэн auth систем.

Frontend-ийг backend-ээс нь тусгаарласан (бүх логик API route-уудад байрладаг) тул дизайныг хожим бүрэн солиход бэлэн.

---

## 1. Юу хийдэг систем вэ

- Имэйл + нууц үгээр **бүртгүүлэх / нэвтрэх**
- **Google-ээр** бүртгүүлэх / нэвтрэх (OAuth)
- **Имэйл хаяг баталгаажуулах** — бүртгүүлэхэд баталгаажуулах холбоос илгээдэг, баталгаажуулаагүй ч нэвтэрч болно (dashboard дээр сануулга харагдана)
- **Нууц үг сэргээх** (имэйлээр холбоос илгээдэг, Gmail SMTP ашигладаг)
- **Admin эрх** — `user` / `admin` гэсэн 2 түвшин, admin бол `/admin` хуудсанд орох боломжтой, бусад хэрэглэгч ороход хаагдана
- **Профайл удирдлага** (`/profile`) — нэр/утас засах, нууц үг солих/тохируулах, Google холбох/салгах, бүртгэл устгах
- **Rate limiting** (Upstash Redis-д хадгалагддаг, serverless орчинд ч найдвартай) — login, signup, forgot-password, change-password, reset-password, resend-verification бүгдэд халдлагаас хамгаалсан хязгаарлалт
- Хэрэглэгчийн мэдээлэл **Supabase (Postgres)** дээр хадгалагдана (локал файл биш, cloud DB)

---

## 2. Ашигласан технологи ба яагаад

| Технологи | Юунд ашигласан | Яагаад |
|---|---|---|
| **Next.js 16** (App Router, Turbopack) | Frontend + backend хоёуланг нь нэг framework-ээр | Frontend/backend нэг repo, API route-ууд `src/app/api/**` дотор шууд бичигддэг |
| **Auth.js / NextAuth v5** | Нэвтрэлт удирдах систем (session, OAuth, credentials) | Google OAuth-ийг гараар (redirect, token exchange) бичихээс зайлсхийж, аюулгүй, шалгагдсан сан ашиглах |
| **Supabase (Postgres)** | Хэрэглэгчийн мэдээлэл хадгалах cloud DB | Үнэгүй, локал файл (SQLite) биш тул сервер хаана ч ажиллаж болно, өгөгдөл алдагдахгүй |
| **postgres (postgres.js)** | Supabase-тай холбогдох, SQL query бичих | Хөнгөн, шууд SQL бичих боломжтой (ORM-ийн давхар давхарга хэрэггүй) |
| **bcryptjs** | Нууц үгийг hash хийх | Нууц үгийг хэзээ ч тодоор (plain text) хадгалдаггүй |
| **nodemailer** + **Gmail SMTP** | Нууц үг сэргээх, имэйл баталгаажуулах имэйл илгээх | Үнэгүй, дурын хэрэглэгчийн ямар ч имэйл рүү илгээх боломжтой (жишээ нь Resend-ийн үнэгүй tier зөвхөн өөрийн имэйл рүү илгээдэг) |
| **Upstash Redis** (`@upstash/ratelimit` + `@upstash/redis`) | Rate limiting-ийн төлөв хадгалах | REST-based, serverless-д тохиромжтой (Vercel гэх мэт олон instance хооронд нэг Redis-ийг хуваалцдаг тул in-memory-ийн адил instance бүрт тусад нь тоологддоггүй), үнэгүй tier |
| **Tailwind CSS v4** | Загвар (styling) | Хурдан, дахин ашиглаж болохоор utility class-ууд |
| **TypeScript** | Бүх код | Алдааг compile хийх үед олох, автомат tooltip/autocomplete |
| **Bun** | Package manager, dev server ажиллуулагч | npm-ээс хурдан |

---

## 3. Систем хэрхэн ажилладаг вэ (Архитектур)

### Нэвтрэлтийн урсгал

1. Хэрэглэгч `/login` эсвэл `/signup` дээр имэйл+нууц үг оруулна, эсвэл "Google-ээр үргэлжлүүлэх" дарна
2. **Имэйл+нууц үг**: `src/auth.ts` доtorh `Credentials` provider нь Supabase-с хэрэглэгчийг олж, `bcryptjs`-аар нууц үгийг шалгана
3. **Google**: Auth.js Google руу redirect хийж, буцаж ирэхэд имэйл дээр нь тулгуурлан Supabase дээрх хэрэглэгчтэй холбоно (эсвэл шинээр үүсгэнэ)
4. Амжилттай бол **session cookie** (JWT, encrypted, httpOnly) тавигдана — энэ нь `role`, `name`, `id`, `image`-г дотроо агуулна
5. `/post-login` хуудас session-ий `role`-оор шалгаж admin бол `/admin`, бусад бол `/dashboard` руу чиглүүлнэ

### Хамгаалалт (route protection)

- `src/proxy.ts` (Next.js 16-д "middleware" гэдгийг "proxy" болгож нэрийг нь өөрчилсөн) нэвтрээгүй хэрэглэгчийг `/dashboard`, `/admin`-аас `/login` руу шидэнэ; admin биш хэрэглэгчийг `/admin`-аас `/dashboard` руу шидэнэ
- Хуудас бүр дотроо (`await auth()`) дахин шалгадаг — proxy-г алгасаж чадвал ч хуудас өөрөө хаалттай хэвээр (defense in depth)

### Нууц үг сэргээх урсгал

1. `/forgot-password` дээр имэйлээ оруулна
2. Сервер санамсаргүй 32 байт token үүсгэж, **зөвхөн hash-ыг нь** (sha256) Supabase дээр хадгална (жинхэнэ token DB-д хэзээ ч хадгалагддаггүй)
3. Жинхэнэ token-той холбоосыг Gmail SMTP-ээр имэйлээр илгээнэ
4. Хэрэглэгч холбоос дараад шинэ нууц үг оруулахад, ирсэн token-ыг hash хийж DB-тэй тулгана; таарвал шинэ нууц үг хадгалж, token-ыг "ашигласан" болгож дахин ашиглагдахаас хаана
5. Token 1 цагийн дараа автоматаар хүчингүй болно

### Имэйл баталгаажуулах урсгал

1. Имэйл+нууц үгээр бүртгүүлэхэд сервер хэрэглэгчийг үүсгээд, санамсаргүй token үүсгэж (**зөвхөн hash-ыг нь** DB-д хадгалж), баталгаажуулах холбоосыг Gmail SMTP-ээр имэйлээр илгээнэ
2. Хэрэглэгч холбоос дараад `api/auth/verify-email` руу орох үед token-ыг шалгаж, `users.email_verified_at`-ыг тохируулна (token 24 цагийн дараа хугацаа дуусна, нэг л удаа ашиглагдана)
3. **Баталгаажуулаагүй ч нэвтэрч, `/dashboard` ашиглаж болно** — зөвхөн сануулга (banner) харагдаж, "Дахин имэйл илгээх" товчоор дахин хүсэлт илгээж болно. Бүрэн блоклохгүй байхыг сонгосон шалтгаан: имэйл spam хавтсанд орох, буруу бичих гэх мэт бага зэргийн саадаар жинхэнэ хэрэглэгчийг бүрэн хаах нь илүү их төвөгтэй
4. **Google-ээр бүртгүүлсэн бол баталгаажуулах имэйл огт илгээгддэггүй** — Google өөрөө тухайн имэйлийн эзэмшлийг аль хэдийн баталгаажуулсан тул `email_verified_at` шууд `now()`-оор тохирдог

### Google холболтын аюулгүй байдал

Хэрэв хэн нэгэн имэйл+нууц үгээр аль хэдийн бүртгэлтэй имэйлээр Google-аар нэвтрэхийг оролдвол, систем **зөвхөн тухайн бүртгэлдээ идэвхтэй нэвтэрсэн хүн профайл дээрээсээ зориудаар холбож байгаа тохиолдолд** зөвшөөрдөг. Ингэснээр хэн нэгэн өөрийн биш имэйлээр урьдчилж бүртгүүлээд, жинхэнэ эзэмшигч нь Google-ээр орохыг оролдоход бүртгэл булаагдахаас сэргийлдэг.

---

## 4. Эхлэх заавар

```bash
# 1. Хамаарлуудыг суулгах
bun install

# 2. .env.local файл үүсгэж доорх хэсгийг бөглөх (доор дэлгэрэнгүй)

# 3. Хөгжүүлэлтийн серверийг асаах
bun run dev
```

Дараа нь `http://localhost:3000` дээр орно.

Бусад командууд:

```bash
bun run build   # Production build
bun run start   # Production серверийг асаах (build хийсний дараа)
bun run lint    # ESLint шалгалт
```

---

## 5. Орчны хувьсагчид (`.env.local`)

`.env.local` файл нь git-д ороогүй (`.gitignore`-д байгаа) тул серверт deploy хийхдээ эдгээрийг тухайн платформын Environment Variables хэсэгт өөрөө нэмэх шаардлагатай.

```bash
# --- Session encryption ---
# NextAuth-ийн session cookie-г шифрлэхэд ашигладаг санамсаргүй тэмдэгт мөр.
# Үүсгэх: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=

# --- Supabase (Postgres) DB холболт ---
# Supabase дашбоард → Connect → Connection string → "Session pooler" сонго
# (Transaction pooler биш — доор энэ хэсгийн төгсгөлд ялгааг тайлбарласан)
# Нэрийн формат pooler дээр өөрчлөгддөг: postgres.[PROJECT-REF]
# Нууц үгэнд @ гэх мэт тусгай тэмдэгт байвал URL-encode хийх (@ -> %40)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:5432/postgres

# --- Google OAuth ---
# Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID
# Authorized redirect URI: http://localhost:3000/api/auth/callback/google
# (production дээр өөрийн домайнаараа сольж дахин нэмэх шаардлагатай)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# --- Нууц үг сэргээх / имэйл баталгаажуулах имэйл (Gmail SMTP) ---
# GMAIL_USER: имэйл илгээгч Gmail хаяг
# GMAIL_APP_PASSWORD: Gmail-ийн энгийн нууц үг БИШ.
#   1) Google акаунтдаа 2 шатлалт баталгаажуулалт (2FA) асаах
#   2) https://myaccount.google.com/apppasswords дээр 16 оронтой App Password үүсгэх
GMAIL_USER=
GMAIL_APP_PASSWORD=

# --- Rate limiting (Upstash Redis) ---
# upstash.com дээр бүртгүүлж (үнэгүй), "Redis" → "Create Database" (Type: Regional)
# Database үүссэний дараа тухайн хуудасны "REST API" хэсгээс хуулна
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

| Хувьсагч | Заавал уу | Байхгүй бол юу болох |
|---|---|---|
| `AUTH_SECRET` | Тийм | Сервер асахгүй / session ажиллахгүй |
| `DATABASE_URL` | Тийм | Ямар ч DB query ажиллахгүй, бүх auth унана |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google login хэрэгтэй бол | Google товч дарахад алдаа өгнө, имэйл/нууц үг хэвээр ажиллана |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Нууц үг сэргээх, имэйл баталгаажуулах функц хэрэгтэй бол | `/forgot-password`, `/api/auth/resend-verification` дээр 500 алдаа өгнө, бусад бүх функц хэвээр ажиллана |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | Тийм | Сервер асахгүй — эдгээргүйгээр rate limiter "чимээгүй унтардаггүй", харин тодорхой алдаа өгч бүх auth route (`proxy.ts` дамжуулан) зогсдог (санаатайгаар ингэж хийсэн — доор [8]-р хэсгийг үзнэ үү) |

### Supabase pooler: Session vs Transaction

Supabase-ийн "Connect" цонхонд 2 өөр pooler сонголт бий, хоёулаа өөр өөр **порт**, өөр **горим**-той:

| | Порт | Горим | postgres.js тохиргоо |
|---|---|---|---|
| **Session pooler** (энэ төсөл үүнийг ашигладаг) | 5432 | Client бүрд тогтвортой нэг backend connection | Default (`prepare: true`) — direct connection шиг ажиллана |
| Transaction pooler | 6543 | Backend connection транзакц бүрт солигдож болно | `{ prepare: false }` **заавал шаардлагатай**, эс тэгвэл зэрэгцээ query-үүд hang хийх/"prepared statement does not exist" алдаа өгөх эрсдэлтэй |

Бид **Session pooler**-ийг сонгосон тул `src/lib/db.ts`-д нэмэлт тохиргоо хийх шаардлагагүй (энгийн direct connection-той адилхан ажиллана), гэхдээ IPv4-тэй тул Vercel гэх мэт орчинд Direct connection-оос илүү найдвартай.

---

## 6. Өгөгдлийн сангийн схем (Supabase, Postgres)

### `users`

| Багана | Төрөл | Тайлбар |
|---|---|---|
| `id` | uuid, default `gen_random_uuid()` | Автоматаар үүсдэг, таамаглах боломжгүй ID |
| `email` | text, unique | Нэвтрэх нэр |
| `name` | text | Харагдах нэр |
| `password_hash` | text, null боломжтой | bcrypt hash. Зөвхөн Google-ээр бүртгүүлсэн бол `null` |
| `google_id` | text, unique, null боломжтой | Google-ээр холбогдсон бол Google-ийн ID |
| `role` | text, default `'user'` | `'user'` эсвэл `'admin'` |
| `phone` | text, null боломжтой | Профайл дээрээс нэмэгддэг, заавал биш |
| `email_verified_at` | timestamptz, null боломжтой | `null` = баталгаажаагүй. Google-ээр бүртгүүлсэн бол шууд тохирдог |
| `created_at` | timestamptz | Бүртгүүлсэн огноо |

### `password_reset_tokens`

| Багана | Төрөл | Тайлбар |
|---|---|---|
| `id` | serial | Token мөрийн өөрийн дугаар (`users.id`-тай хамааралгүй, энэ нь integer хэвээр) |
| `user_id` | uuid, FK → `users.id` (ON DELETE CASCADE) | Хэрэглэгч устахад token-ууд нь ч устана |
| `token_hash` | text, unique | Token-ий sha256 hash (жинхэнэ token хадгалагддаггүй) |
| `expires_at` | timestamptz | 1 цагийн дараа хугацаа дуусна |
| `used_at` | timestamptz, null боломжтой | Ашигласан бол огноо, ашиглаагүй бол `null` |

### `email_verification_tokens`

`password_reset_tokens`-тэй яг ижил бүтэц, зөвхөн зориулалт нь өөр:

| Багана | Төрөл | Тайлбар |
|---|---|---|
| `id` | serial | Token мөрийн өөрийн дугаар (`users.id`-тай хамааралгүй, энэ нь integer хэвээр) |
| `user_id` | uuid, FK → `users.id` (ON DELETE CASCADE) | Хэрэглэгч устахад token-ууд нь ч устана |
| `token_hash` | text, unique | Token-ий sha256 hash (жинхэнэ token хадгалагддаггүй) |
| `expires_at` | timestamptz | 24 цагийн дараа хугацаа дуусна (нууц үг сэргээхээс илүү урт — security-sensitive биш) |
| `used_at` | timestamptz, null боломжтой | Ашигласан бол огноо, ашиглаагүй бол `null` |

Schema-г шинээр Supabase дээр байгуулах бол `CREATE TABLE IF NOT EXISTS` бүхий дээрх 3 хүснэгтийн SQL-ийг Supabase SQL Editor дээр ажиллуулна.

Rate limiting нь эдгээр хүснэгтэд биш, тусад нь **Upstash Redis**-д (`ratelimit:*` түлхүүрүүд, тухайн бакетын цонх өнгөрөхөд автоматаар устдаг) хадгалагдана.

---

## 7. Төслийн бүтэц

```
src/
  auth.ts                        # NextAuth тохиргоо: providers, callbacks (signIn, jwt, session)
  proxy.ts                       # Route хамгаалалт (/dashboard, /admin) — Next.js 16-ийн "proxy" конвенц

  lib/
    db.ts                        # Supabase (Postgres) холболт, User type
    password.ts                  # bcrypt hash/verify helper
    mailer.ts                    # Gmail SMTP-ээр имэйл илгээх (nodemailer)
    reset-token.ts                # Нууц үг сэргээх token үүсгэх/шалгах
    verification-token.ts         # Имэйл баталгаажуулах token үүсгэх/шалгах (reset-token.ts-тэй ижил загвар)
    rate-limit.ts                # Upstash Redis-д суурилсан rate limiter (serverless-д найдвартай)

  app/
    page.tsx                     # Нүүр хуудас
    login/page.tsx                # Нэвтрэх хуудас
    signup/page.tsx               # Бүртгүүлэх хуудас
    forgot-password/page.tsx      # Нууц үг сэргээх хүсэлт
    reset-password/page.tsx       # Шинэ нууц үг тохируулах
    dashboard/page.tsx            # Хамгаалагдсан жишээ хуудас (нэвтэрсэн хэрэглэгчид)
    admin/page.tsx                # Зөвхөн admin-д зориулсан skeleton хуудас
    profile/page.tsx              # Профайл (Clerk маягийн tab-тай хуудас)
    post-login/page.tsx           # Нэвтэрсний дараах role-based redirect

    api/auth/
      [...nextauth]/route.ts      # NextAuth-ийн бүх auth endpoint (signin/signout/callback/session)
      signup/route.ts             # Шинэ хэрэглэгч бүртгэх + баталгаажуулах имэйл илгээх
      verify-email/route.ts       # Баталгаажуулах token шалгах (GET, имэйл дэх холбоос)
      resend-verification/route.ts # Баталгаажуулах имэйл дахин илгээх
      forgot-password/route.ts    # Сэргээх имэйл илгээх
      reset-password/route.ts     # Токеноор нууц үг солих

    api/user/
      profile/route.ts            # Нэр/утас засах (PATCH)
      change-password/route.ts    # Нууц үг солих/тохируулах
      unlink-google/route.ts      # Google холболт салгах
      delete-account/route.ts     # Бүртгэл устгах

  components/
    auth-card.tsx                 # Дахин ашиглагддаг login/signup card (AuthCard, AuthField, ...)
    google-button.tsx             # "Google-ээр үргэлжлүүлэх" товч
    navbar.tsx                    # Дээд цэс
    user-menu.tsx                 # Avatar + dropdown (профайл/admin/гарах)
    avatar.tsx                    # Google зураг эсвэл нэрний үсгээр avatar
    resend-verification-banner.tsx # Dashboard дээрх "имэйлээ баталгаажуулаагүй" сануулга
    profile/                      # /profile хуудасны мөр бүрийн (нэр, утас, нууц үг, ...) компонентууд

  types/next-auth.d.ts            # Session type өргөтгөл (id, role нэмэх)
```

---

## 8. Аюулгүй байдлын арга хэмжээ

- Нууц үг **bcrypt** (salt-тай) hash хийгдэж хадгалагдана, хэзээ ч тодоор биш
- Session cookie **httpOnly, encrypted (JWE), sameSite=lax** — JavaScript-аар уншигдахгүй, XSS-д илүү тэсвэртэй
- Нууц үг сэргээх болон имэйл баталгаажуулах token хоёулаа **зөвхөн hash хэлбэрээр** хадгалагдана, хугацаатай (1 цаг / 24 цаг), нэг л удаа ашиглагдана
- `forgot-password` нь бүртгэлтэй эсэхээс үл хамааран **ижил ерөнхий хариу** өгдөг (хэрэглэгчийн имэйл бүртгэлтэй эсэхийг мэдэхгүй байлгах — user enumeration-оос сэргийлэх)
- **Rate limiting** (**Upstash Redis** дээр хадгалагддаг, IP/имэйлээр, 15 минутын цонхтой): signup 5/IP, login 10/имэйл + 30/IP, forgot-password 5/IP + 3/имэйл, resend-verification 5/IP + 3/имэйл, change-password 10/хэрэглэгч, reset-password 20/IP. Upstash env var тохируулаагүй бол сервер тодорхой алдаатайгаар зогсдог — rate limiting "чимээгүй унтардаггүй" (санаатай шийдвэр — доор тайлбарласан)
- Google-ийг нууц үгтэй хуучин бүртгэлд **чимээгүй холбохгүй** (эзэмшлийн эрсдэлээс сэргийлнэ — дээрх 3-р хэсгийг үзнэ үү)
- `/admin` нь **2 давхар** шалгагддаг: `proxy.ts`-д мөн тухайн хуудас өөрөө (`await auth()`)
- **Role staleness recheck**: admin эрхийг цуцлахад session автоматаар шинэчлэгддэггүй тул (JWT session нь нэвтрэх үед л role-оо "хөлддөг") `src/auth.ts`-ийн `jwt` callback нь `token.roleCheckedAt`-аа ашиглан **~5 минут тутамд** role-ыг DB-тэй дахин тулгадаг. Ингэснээр admin эрх хассанаас хойш хамгийн ихдээ 5 минутын дотор `/admin`-ийн хаалт хүчинтэй болдог, гэхдээ хүсэлт бүрт DB рүү хандахгүй (доор дэлгэрэнгүй)

### Role staleness recheck хэрхэн ажилладаг вэ

- `token.iat` (гарын үсгийн огноо) нь **request бүрт шинэчлэгддэггүй** — зөвхөн анх нэвтрэх үед л тогтдог тул үүгээр "сүүлд хэзээ шалгасан бэ" гэдгийг хэмжих боломжгүй (баталгаажуулсан). Тиймээс өөрсдийн `roleCheckedAt` талбарыг ашигласан.
- Токен мутаци нь зөвхөн **`proxy.ts`-ээр дамжсан хүсэлтүүдэд** (`/dashboard`, `/admin`) бодитоор cookie рүү persist хийгддэг (баталгаажуулсан — Set-Cookie header бүрт шалгасан). `/profile`, `/api/user/*` зэрэг нь `proxy.ts`-ийн matcher-т ороогүй тул тэдгээрт хийсэн шалгалт хадгалагдахгүй, харин role тэдгээрт юу ч хаадаггүй (зөвхөн текст болгон харуулдаг) тул аюулгүй — 5 минут өнгөрсний дараа тэдгээр route-д хандах бүрт нэг хөнгөн (нэг баганатай, PK-гаар индексжсэн) `SELECT role` дахин ажиллана. Энэ бол мэдэгдэж, зөвшөөрөгдсөн trade-off — `/dashboard`, `/admin`-ийг ч бас matcher-т нэмбэл засагдана, гэхдээ хамрах хүрээг өргөтгөх шаардлагагүй гэж шийдсэн.
- Бодитоор тестэлсэн: admin-аар нэвтэрч → DB-д шууд `role='user'` болгож демот хийхэд → интервал өнгөрөөгүй үед session хуучирсан хэвээр `/admin`-д зөвшөөрдөг → интервал өнгөрсний дараа дараагийн хүсэлт дээр DB-тэй тулгаж, `role` шинэчлэгдэж, `/admin` хаагддаг, session-ий `role` талбар нь ч зөв шинэчлэгддэг.

### Яагаад Upstash тохируулаагүй үед систем "унадаг" вэ

`src/lib/rate-limit.ts` нь module ачаалагдах үед `UPSTASH_REDIS_REST_URL`/`TOKEN`-г шалгаж, байхгүй бол шууд `throw` хийдэг (`db.ts`, `mailer.ts`-тэй адил загвар). Энэ нь санаатай хийсэн зүйл: rate limiter байхгүй үед "аюулгүй байдлын хамгаалалтгүйгээр чимээгүй үргэлжлэх" нь халдлагад өртөх боломж үүсгэдэг тул, орчны хувьсагч дутуу байгааг нэн даруй, тодорхой алдаагаар мэдэгдэх нь илүү зөв гэж үзсэн.
