# TripMind AI 배포 가이드

## 사전 요구사항

- Node.js 20+
- OpenRouter API 키 (필수)
- (선택) Google Maps API 키, AI HUB API 키

---

## 1. 환경 변수

```bash
cp .env.example .env.local
```

| 변수 | 설명 |
|------|------|
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/keys) API 키 |
| `AIHUB_API_KEY` | (선택) AI HUB aihubshell 키 |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | (선택) Google Maps |

> `.env.local`은 Git에 커밋하지 마세요.

---

## 2. 로컬 개발

```bash
npm install
npm run dev
```

여행 데이터는 `data/trips/` 폴더에 JSON 파일로 저장됩니다.

---

## 3. Vercel 배포

### 환경 변수 (Vercel 대시보드 → Settings → Environment Variables)

| 변수 | 필수 |
|------|------|
| `OPENROUTER_API_KEY` | ✅ |
| `NEXT_PUBLIC_SITE_URL` | 권장 (`https://your-domain.vercel.app`) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | 선택 |
| `AIHUB_API_KEY` | 선택 |

### 60초 타임아웃

Vercel Hobby 플랜은 API Route **최대 60초** 제한이 있습니다.  
`/api/trips/generate`는 Vercel 환경에서 자동으로 **빠른 모드**로 동작합니다.

- AI HUB 조회 생략
- 우선 무료 모델 직접 호출 (모델 목록 API 생략)
- **최대 7일** 일정까지 생성
- 4일 이하 일정 권장 (응답 속도)

Pro 플랜에서 `maxDuration`을 늘릴 수 있으나, 현재는 60초에 최적화되어 있습니다.

### 데이터 저장 주의

Vercel에서는 `/tmp`에 임시 저장됩니다. **재배포·콜드스타트 후 데이터가 사라질 수 있습니다.**

프로덕션 영구 저장이 필요하면 VPS/Docker 또는 외부 DB 마이그레이션이 필요합니다.

---

## 4. OpenRouter 설정

무료 모델만 사용합니다 (`max_price=0`).

```
GET /api/openrouter/models   # 사용 가능한 무료 모델 목록
```

실패 시 자동으로 다음 무료 모델로 전환됩니다.

---

## 5. AI HUB 연동 (선택)

`aihubshell` 스펙과 동일한 HTTP API를 사용합니다.

```
GET /api/aihub/datasets
GET /api/aihub/datasets?keyword=관광
```

---

## 6. 폴더 구조

```
src/
├── app/api/          # API 라우트
├── components/       # UI 컴포넌트
├── lib/
│   ├── ai/           # 일정 생성
│   ├── aihub/        # AI HUB 연동
│   ├── db/           # JSON 파일 저장소
│   └── openrouter/   # OpenRouter 클라이언트
data/trips/           # 여행 데이터 (로컬, gitignore)
```

---

## 7. 트러블슈팅

| 문제 | 해결 |
|------|------|
| AI 일정 생성 504 | Vercel 60초 제한 — 일수 4일 이하로 시도, `OPENROUTER_API_KEY` 확인 |
| AI 일정 생성 실패 | `OPENROUTER_API_KEY` 확인, `/api/openrouter/models` 조회 |
| 여행 저장 안 됨 | `data/trips/` 폴더 쓰기 권한 확인 |
| 지도 미표시 | Google Maps API 키 설정 |
