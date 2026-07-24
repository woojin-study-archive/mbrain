# MBrain

현대백화점 AI 악성재고 사전예측 및 실질 마진 최적화 PoC입니다.

판매·재고·시즌·외부 수요 신호를 바탕으로 악성재고 전환 위험을 탐지하고,
지점 이동·메인 노출·할인·반품 전략의 예상 실질 마진을 비교합니다.

## 주요 기능

- 악성재고 전환 확률 및 위험 근거 조회
- 현대백화점 지점별 재고·판매속도 비교
- 지점 간 재고 이동 타당성 시뮬레이션
- AI 처리 전략 비교 및 조건 조정
- 관리자 승인·반려 워크플로
- MCP 요청·응답 및 판단 근거 로그

## 기술 스택

- Vite
- React 19
- TypeScript
- React Router
- GitHub Pages
- GitHub Actions

## 로컬 실행

- Node.js `>=20.19.0`

```bash
nvm use
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3001`에서 실행됩니다.

## 빌드

```bash
npm run build
```

빌드 결과는 `dist/`에 생성됩니다.

## GitHub Pages 배포

`main` 브랜치에 변경사항을 푸시하면 GitHub Actions가 자동으로 빌드하고
GitHub Pages에 배포합니다.

- 배포 주소: https://woojin-study-archive.github.io/mbrain/
- GitHub 저장소 설정: `Settings → Pages → Source → GitHub Actions`
- 화면 경로는 Pages 새로고침 호환성을 위해 Hash Router를 사용합니다.
