# 🏙️ 신입의 역습!! — 슬기로운 민원생활

> 신입 공무원이 되어 10명의 기상천외한 민원인을 해결하고 시장까지 승진하는 대화형 RPG

## 🎮 게임 소개

- **장르**: 웹툰 스타일 대화형 RPG 시뮬레이션
- **AI 엔진**: Google Gemini 2.0 Flash
- **목표**: 10명의 민원인 처리 → 9급 서기보 → 시장 승진
- **최적화**: 모바일 우선 반응형 (100dvh, safe-area)

## 👥 민원인 캐릭터 10종

| # | 이름 | 유형 | 핵심 민원 |
|---|------|------|-----------|
| 1 | 나절차 | 원칙주의자 | 옆집 담장 1cm 초과 철거 요구 |
| 2 | 박급해 | 급한 어르신 | 번호표 뽑자마자 창구 두드림 |
| 3 | 김인플 | SNS 생중계 | 민원실 조명 교체 요구 |
| 4 | 정다정 | 이야기꾼 할머니 | 기초연금 문의 → 손주 자랑 |
| 5 | 이호의 | 청탁 시도 | 과태료 감면 + 에너지 음료 |
| 6 | 최강력 | 협박형 | 불법주차 과태료 취소 협박 |
| 7 | 오해해 | 정보 왜곡 | 안 된다 → 해준다로 오해 |
| 8 | 한까탈 | 위생 예민 | 정수기 컵 지문 → 구청장 면담 |
| 9 | 조용히 | 과묵 압박 | 서류 내밀고 눈빛 압박 |
| 10 | 이미안 | 사과 불굴 | 사과하며 폐기물 스티커 요구 |

## 🚀 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local 파일에 GEMINI_API_KEY 입력

# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

## 📁 프로젝트 구조

```
├── public/
│   ├── 1_나절차.png   ~ 10_이미안.png  (캐릭터 이미지 10종)
├── src/
│   ├── App.tsx        (메인 게임 컴포넌트)
│   ├── constants.ts   (캐릭터 데이터, 배경 URL)
│   ├── types.ts       (TypeScript 타입)
│   ├── main.tsx       (React 엔트리)
│   └── index.css      (Tailwind CSS)
├── index.html
├── vite.config.ts
└── package.json
```

## 🛠️ 기술 스택

- React 19 + TypeScript
- Google Gemini 2.0 Flash API
- Tailwind CSS v4
- Motion (Framer Motion)
- Vite 6

## 📝 업데이트 이력

- ✅ AI 모델: `gemini-2.0-flash`
- ✅ 캐릭터 이미지 10종 로컬 PNG 연동
- ✅ 모바일 최적화 (100dvh, viewport-fit=cover)
- ✅ 이미지 로드 실패 시 이모지 폴백
- ✅ 게임 로직 버그 수정 (턴 종료 후 버튼 정상 노출)
- ✅ Spring 애니메이션 고도화
