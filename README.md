# Sliding Puzzle

3×3~5×5 슬라이딩 퍼즐을 풀고, 로그인한 사용자의 **개인 기록과 성장 통계**를 저장해 보여주는 풀스택 웹 게임입니다.

> 🚧 개발 중입니다. 배포 링크와 스크린샷은 완성 후 추가합니다.

## 주요 기능 (예정)

- 3×3 / 4×4 / 5×5 크기 선택, 클릭과 방향키로 플레이
- 회원가입 / 로그인 (httpOnly 쿠키 JWT)
- 서버가 이동 기록을 다시 재생해서 검증한 뒤 기록 저장
- 크기별 최고 기록, 최근 플레이, 성장 추이 차트

## 구조

npm workspaces monorepo로, 게임 규칙을 클라이언트와 서버가 함께 씁니다.

```
shared/   게임 로직 (순수 함수: 섞기, 이동, 완성 판정, 재생 검증)
client/   React + Vite 화면
server/   Express API + Prisma + PostgreSQL
```

## 기술 스택

| 영역       | 선택                                                            |
| ---------- | --------------------------------------------------------------- |
| 프런트엔드 | React, TypeScript, Vite, TanStack Query, Recharts, Tailwind CSS |
| 백엔드     | Node.js, Express, Zod, Prisma, PostgreSQL                       |
| 테스트     | Vitest, Supertest, React Testing Library                        |
| 도구       | oxlint, Prettier                                                |

## 실행 방법

Node.js 22 이상이 필요합니다.

```bash
npm install          # 의존성 설치
cp server/.env.example server/.env   # 환경변수 파일 만들기 (값 채우기)
npm run dev          # 클라이언트(http://localhost:5173) + 서버(http://localhost:3000)
```

| 명령어           | 설명                     |
| ---------------- | ------------------------ |
| `npm run dev`    | 개발 서버 실행           |
| `npm test`       | 전체 테스트 (3개 패키지) |
| `npm run lint`   | 린트 (oxlint)            |
| `npm run build`  | 전체 빌드                |
| `npm run format` | Prettier 포맷            |

## 앞으로 채울 내용

- 아키텍처 그림
- 기록 검증 설계와 한계
- API 목록
- 트러블슈팅 기록
- 개선 계획
