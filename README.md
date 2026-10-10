# 새벽이슬 말씀 캡슐 머신

수원제일교회 새벽이슬청년부 노방전도용 캡슐 뽑기. 스태프 폰에서 레버를 돌리면 1~5등 상품과 말씀 한 구절이 나온다.

- 뽑기: `/` · 재고 관리: `/admin`
- 설계: [`docs/superpowers/specs/2026-10-07-saebyeok-capsule-draw-design.md`](docs/superpowers/specs/2026-10-07-saebyeok-capsule-draw-design.md)
- 디자인 시안(A안): https://claude.ai/artifact/PnoE7wSNo9b4p324AEYVX9

## 로컬에서 돌려보기

```bash
npm install
ADMIN_PASSWORD=아무거나 npm run dev
```

Supabase 환경변수가 없으면 **개발 모드에서만** 메모리 재고(초기값 133개)로 돈다. 서버를 재시작하면 초기화된다.

같은 Wi‑Fi의 iPad에서 열어보려면 Mac의 IP를 허용하고 모든 인터페이스로 띄운다.

```bash
ipconfig getifaddr en0   # 예: 172.30.1.1
ADMIN_PASSWORD=아무거나 ALLOWED_DEV_ORIGINS=172.30.1.1 npm run dev -- -H 0.0.0.0 -p 3030
# iPad Safari → http://172.30.1.1:3030
```
프로덕션에서 환경변수가 빠지면 메모리로 돌지 않고 에러를 낸다.

```bash
npm test        # 뽑기 로직·입력 검증·말씀 데이터 테스트
npm run lint
npm run build
```

## 배포

### 1. Supabase

1. https://supabase.com 에서 새 프로젝트를 만든다(무료 플랜, 지역은 Seoul).
2. **SQL Editor**에 [`supabase/schema.sql`](supabase/schema.sql) 내용을 붙여넣고 실행한다.
   상품 테이블, 재고 차감 함수, 초기 재고(1등 7 · 2등 21 · 3~5등 35)가 만들어진다.
3. **Project Settings → API**에서 Project URL과 Secret key(또는 legacy `service_role` key)를 복사한다.

> 브라우저용 키(anon / publishable)로는 재고를 읽거나 바꿀 수 없게 막혀 있다. 키는 서버에서만 쓴다.

### 2. Vercel

1. 이 저장소를 GitHub에 올리고 Vercel에서 Import 한다(프레임워크는 Next.js 자동 인식).
2. **Environment Variables**에 세 개를 넣는다.

   | 이름 | 값 |
   |---|---|
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Secret key |
   | `ADMIN_PASSWORD` | 관리 화면 비밀번호 |

3. Deploy. 배포 URL을 스태프에게 공유하고, `/admin` 비밀번호는 리더만 갖는다.

### 3. 전도 전날 체크

- ⚠️ **Supabase 무료 플랜은 1주일 동안 요청이 없으면 일시정지된다.** 전날 `/admin`에 들어가 재고가 보이는지 확인한다.
  일시정지됐으면 Supabase 대시보드에서 Restore 한다.
- `/admin`에서 상품명과 수량을 최종 확인한다.
- 테스트로 뽑아봤다면 `/admin`에서 남은 수량을 처음 수량으로 되돌린다.

## 말씀

[`lib/verses.ts`](lib/verses.ts)의 22구절 중 하나가 무작위로 나온다(사랑 5 · 소망·위로 10 · 전도·초대 7).
본문은 대한성서공회 개역개정 원문과 글자 단위로 대조했다. 구절을 바꾸면 원문과 다시 대조할 것.
