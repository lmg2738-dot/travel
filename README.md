# TripMind AI

AI HUB 관광 데이터와 OpenRouter 무료 모델을 활용한 스마트 여행 플래너.

## 기능

- **AI 일정 생성** — OpenRouter 무료 모델로 자동 생성
- **예산 플래너** — 카테고리별 예산 시각화
- **Google Maps** — 추천 장소 지도 표시
- **체크리스트** — 여행 준비물 자동 생성
- **저장 & 공유** — 로컬 JSON 파일 저장 + 공유 링크

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js, TypeScript, TailwindCSS |
| Backend | Next.js API Routes |
| Storage | 로컬 JSON (`data/trips/`) |
| AI | OpenRouter (무료 모델) |
| Data | AI HUB 관광 데이터 |

## 빠른 시작

```bash
npm install
cp .env.example .env.local
# OPENROUTER_API_KEY 입력
npm run dev
# → http://localhost:50002
```

## 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API 키 |
| `AIHUB_API_KEY` | 선택 | AI HUB 데이터 연동 |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | 선택 | 지도 표시 |

## API

```bash
POST /api/trips/generate   # AI 일정 생성
GET  /api/trips            # 여행 목록
GET  /api/trips/{id}       # 여행 상세
GET  /api/share/{token}    # 공유 링크
```
