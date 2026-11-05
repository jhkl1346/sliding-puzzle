# 슬라이딩 퍼즐 프로젝트 기획서

> 이 문서를 프로젝트 루트에 `SPEC.md`로 두고, 위에서부터 순서대로 진행합니다.
> Claude Code와 작업할 때는 "SPEC.md를 읽고 다음 마일스톤을 진행해줘"처럼 요청하면 됩니다.
>
> **현재 진행 상황 (2026-11-05 기준):** 마일스톤 0 완료. 다음은 마일스톤 1입니다.

---

## 1. 프로젝트 개요

| 항목       | 내용                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| 이름       | Sliding Puzzle (슬라이딩 퍼즐)                                                                             |
| 한 줄 소개 | 3×3~5×5 슬라이딩 퍼즐을 풀고, 로그인한 사용자의 **개인 기록과 성장 통계**를 저장해 보여주는 풀스택 웹 게임 |
| 목표 직군  | 개발 (풀스택, 백엔드 경험 쌓기)                                                                            |
| 예상 기간  | 5~7일                                                                                                      |
| 완료 기준  | 배포 링크가 있고, 서버 API 테스트가 있고, README에 설계 이유와 트러블슈팅이 정리되어 있을 것               |

### 이 프로젝트로 보여줄 역량

- 게임 규칙을 **순수 함수**로 분리하고 테스트하는 설계
- 회원가입 / 로그인 (비밀번호 해시, 쿠키 기반 JWT 인증)
- REST API 설계, 입력 검증, 권한 검사 (내 기록만 접근)
- DB 설계와 마이그레이션 (PostgreSQL + Prisma)
- **서버 측 기록 검증** (이동 기록을 서버가 다시 재생해서 조작 방지)
- 클라이언트와 서버가 **같은 게임 로직 코드를 공유**하는 구조 (monorepo)
- 통계 집계와 차트 시각화
- 프런트 + 백엔드 + DB 배포

### 범위 (이번에 하지 않는 것)

- 랭킹 / 다른 사용자와의 비교: 개인 기록만 저장합니다. (확장 아이디어에 남겨 둠)
- 소셜 로그인, 이메일 인증, 비밀번호 찾기

---

## 2. 게임 규칙

- N×N 판에 타일 1~(N²-1)이 있고 빈칸 1개가 있습니다.
- 빈칸과 인접한 타일을 눌러(또는 방향키로) 빈칸 쪽으로 옮깁니다.
- 타일이 왼쪽 위부터 1, 2, 3 ... 순서로 배치되고 빈칸이 오른쪽 아래에 있으면 완성입니다.
- **판 크기: 3×3, 4×4, 5×5** (이번 범위). 크기는 상수로 관리해서 나중에 쉽게 추가합니다.
- **기록:** 이동 횟수(적을수록 좋음)와 걸린 시간(짧을수록 좋음). 점수 공식은 만들지 않고 두 값을 따로 기록합니다.

### 퍼즐 생성 방식 (중요)

무작위로 타일을 섞으면 **풀 수 없는 배치**가 생길 수 있습니다. 그래서 다음 방식을 씁니다.

1. 완성 상태에서 시작합니다.
2. 시드 기반 난수(PRNG)로 "합법적인 이동"을 N번 반복해서 섞습니다. (바로 직전 이동을 되돌리는 이동은 피함)
3. 섞은 횟수는 크기별 상수로 둡니다. (예: 3×3은 80회, 4×4는 150회, 5×5는 250회. 직접 체감하며 조정)
4. 같은 시드 + 같은 크기면 항상 같은 배치가 나옵니다. (서버 검증의 기반)
5. 섞은 결과가 이미 완성 상태면 다시 섞습니다.

---

## 3. 기술 스택

| 영역       | 선택                                                                        | 선택 이유                                    |
| ---------- | --------------------------------------------------------------------------- | -------------------------------------------- |
| 구조       | npm workspaces monorepo (`shared`, `client`, `server`)                      | 게임 로직을 클라이언트와 서버가 공유         |
| 공유 로직  | TypeScript 순수 함수                                                        | 테스트하기 쉽고 서버 재생 검증에 그대로 사용 |
| 프런트엔드 | React + TypeScript + Vite                                                   | 날씨 앱에서 익숙한 스택                      |
| 서버 상태  | TanStack Query                                                              | 로딩, 에러, 캐시 처리                        |
| 차트       | Recharts                                                                    | 성장 추이 그래프                             |
| 스타일     | Tailwind CSS                                                                | 반응형, 타일 애니메이션                      |
| 백엔드     | Node.js + Express + TypeScript                                              | 백엔드 기본기를 직접 익히기 좋음             |
| 입력 검증  | Zod                                                                         | 요청 본문을 타입과 함께 검증                 |
| DB         | PostgreSQL + Prisma                                                         | 관계형 DB 설계와 마이그레이션 경험           |
| 인증       | bcrypt + JWT (httpOnly 쿠키)                                                | 토큰을 JS에서 못 읽게 해서 안전              |
| 보안       | helmet, cors, express-rate-limit                                            | 기본 보안 설정                               |
| 테스트     | Vitest + Supertest + React Testing Library                                  | 로직, API, 화면 테스트                       |
| 린트/포맷  | oxlint + Prettier                                                           | 날씨 앱과 동일                               |
| 배포       | 클라이언트 Vercel, 서버 Render(또는 Railway), DB Neon(또는 Render Postgres) | 무료 플랜으로 가능                           |

> 로컬 DB는 Docker가 있으면 Docker Compose로 Postgres를 띄우고, 없으면 Neon 같은 무료 호스팅 DB의 연결 주소를 `.env`에 넣어 개발합니다. (마일스톤 2에서 결정)

---

## 4. 폴더 구조 (제안)

```
sliding-puzzle/
├─ package.json              # workspaces 설정
├─ shared/                   # 게임 로직 (클라이언트와 서버가 함께 사용)
│  └─ src/
│     ├─ board.ts            # 보드 생성, 이동, 완성 판정
│     ├─ shuffle.ts          # 시드 기반 섞기
│     ├─ prng.ts             # 시드 난수 생성기
│     ├─ replay.ts           # 이동 기록을 재생해 결과 검증
│     ├─ constants.ts        # SIZES, 크기별 섞기 횟수
│     └─ *.test.ts
├─ client/
│  └─ src/
│     ├─ api/                # 서버 요청 함수
│     ├─ components/         # Board, Tile, Timer, StatsCards, TrendChart ...
│     ├─ hooks/              # useGame, useAuth, useStats ...
│     ├─ pages/              # LoginPage, GamePage, RecordsPage
│     └─ main.tsx
├─ server/
│  ├─ prisma/
│  │  └─ schema.prisma
│  └─ src/
│     ├─ routes/             # auth.ts, games.ts, stats.ts
│     ├─ middleware/         # requireAuth, errorHandler, rateLimit
│     ├─ services/           # 비즈니스 로직 (게임 시작·종료, 통계)
│     ├─ schemas/            # Zod 스키마
│     ├─ app.ts              # Express 앱 (테스트에서 import)
│     └─ index.ts            # 서버 실행
├─ SPEC.md
├─ CLAUDE.md
└─ README.md
```

---

## 5. 기능 목록

### MVP (필수)

- [ ] 3×3 / 4×4 / 5×5 중 크기를 골라 게임 시작
- [ ] 타일 클릭과 방향키로 이동, 이동 횟수·타이머 표시
- [ ] 완성 시 결과 화면 (이동 횟수, 시간, 개인 최고 기록 갱신 여부)
- [ ] 회원가입 / 로그인 / 로그아웃
- [ ] 완료한 게임 기록을 서버에 저장 (서버가 재생해서 검증)
- [ ] 내 기록 페이지: 크기별 최고 기록(최소 이동, 최단 시간), 최근 플레이 목록
- [ ] 로딩 / 에러 / 빈 상태 처리

### 확장 (추천)

- [ ] 성장 추이 차트 (최근 7일·30일 평균 이동 횟수·시간)
- [ ] 내 기록 삭제 (남의 기록은 불가)
- [ ] 다시 섞기 / 포기 기록 (완료율 계산)
- [ ] 이동 애니메이션, 모바일 터치 지원, 다크 모드
- [ ] 비로그인 연습 모드 (기록 저장 없이 플레이)

### 도전 (선택)

- [ ] 판 크기 추가 (6×6 이상, 직사각형 판)
- [ ] 최소 이동 횟수 계산 (3×3은 IDA\* 알고리즘)과 "최적 대비 효율" 표시
- [ ] 플레이 다시보기 (저장된 이동 기록 재생)
- [ ] 같은 문제 다시 풀기 (시드 공유 링크)
- [ ] 이미지 퍼즐 (사진을 타일로 쪼개기)
- [ ] 랭킹 / 친구와 기록 비교

---

## 6. 데이터 모델 (Prisma 예시)

```prisma
model User {
  id           String   @id @default(uuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  games        Game[]
}

enum GameStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

model Game {
  id         String     @id @default(uuid())
  userId     String
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  size       Int                       // 3, 4, 5 ... (허용 목록은 shared/constants.ts)
  seed       Int                       // 퍼즐 배치를 재현하는 시드
  status     GameStatus @default(IN_PROGRESS)
  startedAt  DateTime   @default(now())
  finishedAt DateTime?
  moves      Int?                      // 완료 시에만
  timeMs     Int?                      // 완료 시에만
  moveLog    Json?                     // 이동한 타일 번호 배열

  @@index([userId, size, status])
  @@index([userId, finishedAt])
}
```

- 게임 시작 시 `IN_PROGRESS` 행을 만들고, 완료 / 포기 때 값을 채웁니다. 테이블 하나로 "시작 횟수·완료율·기록"을 모두 계산할 수 있습니다.
- `size`는 DB 제약 대신 앱 코드의 허용 목록으로 검증합니다. 나중에 크기를 추가해도 마이그레이션이 필요 없습니다.

---

## 7. API 설계

모든 응답은 JSON입니다. `인증 필요`는 로그인 쿠키가 있어야 합니다.

| 메서드 | 경로                     | 인증 | 설명                                                          |
| ------ | ------------------------ | ---- | ------------------------------------------------------------- |
| POST   | `/api/auth/register`     | X    | 회원가입 `{ username, password }`                             |
| POST   | `/api/auth/login`        | X    | 로그인, httpOnly 쿠키 발급                                    |
| POST   | `/api/auth/logout`       | O    | 쿠키 삭제                                                     |
| GET    | `/api/auth/me`           | O    | 현재 사용자 정보                                              |
| POST   | `/api/games`             | O    | 새 게임 시작 `{ size }` → `{ id, size, seed }`                |
| POST   | `/api/games/:id/finish`  | O    | 완료 제출 `{ moveLog, timeMs }` → 서버 재생 검증 후 결과 반환 |
| POST   | `/api/games/:id/abandon` | O    | 포기 처리                                                     |
| GET    | `/api/games`             | O    | 내 완료 기록 목록 (`?size=4&page=1`)                          |
| DELETE | `/api/games/:id`         | O    | 내 기록 삭제 (소유자만)                                       |
| GET    | `/api/stats`             | O    | 내 통계 (크기별 최고 기록, 평균, 최근 추이, 완료율)           |

### 완료 제출 검증 규칙 (`finish`)

1. 게임이 존재하고, **내 게임**이고, 아직 `IN_PROGRESS`인지 확인 (아니면 403 / 404 / 409)
2. `shared`의 `replay(size, seed, moveLog)`로 처음 배치에서 이동을 재생
   - 중간에 **불가능한 이동**이 있으면 거부
   - 끝났을 때 **완성 상태가 아니면** 거부
3. `moves = moveLog.length`로 서버가 직접 계산 (클라이언트가 보낸 이동 횟수는 믿지 않음)
4. `timeMs`는 다음 범위 안일 때만 인정
   - 하한: `moves × 최소 이동 간격(예: 30ms)` 보다 작으면 비현실적이라 거부
   - 상한: `서버 기준 경과 시간(now - startedAt)` 보다 크면 거부
5. 통과하면 `COMPLETED`로 저장하고, 이번 기록이 개인 최고인지 함께 응답

> 시간은 클라이언트가 측정한 값을 서버가 범위로 검증하는 방식입니다. "완전한 조작 방지"가 아니라 "비현실적인 값 차단"이라는 한계를 README에 솔직하게 적습니다.

### 오류 응답 형식 (통일)

```json
{ "error": { "code": "INVALID_MOVE_LOG", "message": "이동 기록이 올바르지 않아요." } }
```

---

## 8. 설계 포인트

### 8-1. 공유 로직 (shared)

```ts
type Board = number[] // 길이 size*size, 0이 빈칸
function createSolved(size: number): Board
function shuffle(size: number, seed: number): Board
function canMove(board: Board, size: number, tile: number): boolean
function move(board: Board, size: number, tile: number): Board // 새 배열 반환 (불변)
function isSolved(board: Board, size: number): boolean
function replay(size: number, seed: number, moveLog: number[]): { ok: boolean; moves: number }
```

- 모두 부수효과 없는 순수 함수로 만들어 테스트합니다.
- 서버와 클라이언트가 같은 코드를 쓰기 때문에, 화면에서 풀렸다고 본 퍼즐을 서버도 같은 결과로 판정합니다.

### 8-2. 인증

- 비밀번호는 bcrypt로 해시 (평문 저장 금지, 로그에도 남기지 않기)
- JWT는 **httpOnly + Secure + SameSite 쿠키**에 저장 (localStorage 사용 금지)
- 로그인 / 회원가입에는 요청 횟수 제한을 더 엄격하게 적용
- 로그인 실패 메시지는 "아이디 또는 비밀번호가 틀렸어요"로 통일 (계정 존재 여부를 알려주지 않음)

### 8-3. 권한

- 모든 `/api/games/:id` 요청은 `game.userId === 로그인한 사용자`인지 확인합니다.
- 남의 기록에 접근하면 존재 여부를 숨기기 위해 404를 돌려주는 방안도 검토합니다.

### 8-4. 배포 시 쿠키 문제 (미리 알아두기)

- 클라이언트(Vercel)와 서버(Render)가 **서로 다른 도메인**이면 쿠키가 막힐 수 있습니다. (`SameSite=None; Secure`와 CORS `credentials` 설정 필요)
- 더 간단한 방법은 Vercel의 rewrites로 `/api/*`를 서버로 프록시해서 **같은 도메인처럼** 만드는 것입니다.
- 어느 쪽을 택했는지와 이유를 README 트러블슈팅에 기록합니다.

### 8-5. UI 상태 (모든 화면에서 4가지 처리)

| 상태    | 처리                                      |
| ------- | ----------------------------------------- |
| loading | 스켈레톤 또는 로딩 문구                   |
| error   | 원인별 메시지 + 다시 시도                 |
| empty   | "아직 기록이 없어요. 첫 게임을 해 보세요" |
| success | 정상 렌더링                               |

### 8-6. 예외 상황 체크

- [ ] 게임 도중 새로고침하면? (진행 중 게임은 이어서 하지 않고 새 게임으로 안내, 서버에는 IN_PROGRESS가 남음)
- [ ] 같은 게임을 두 번 완료 제출하면? (두 번째는 409)
- [ ] 로그인 만료 중 완료 제출하면? (기록 저장 실패 안내 + 로그인 유도)
- [ ] 오래 방치된 IN_PROGRESS 게임 처리 (통계에서는 제외하거나 ABANDONED로 정리)
- [ ] 이동 중 타이머가 시작되는 시점 (첫 이동부터 시작)
- [ ] 허용되지 않은 `size`, 너무 큰 `moveLog` 배열 요청 (Zod로 길이 제한)

### 8-7. 접근성

- 타일은 `button`으로 만들고 `aria-label="타일 7, 빈칸 쪽으로 이동"` 같은 설명을 제공합니다.
- 방향키로 플레이할 수 있고, 키보드만으로 전체 흐름을 사용할 수 있어야 합니다.
- 색만으로 상태를 구분하지 않고, 명도 대비를 확인합니다. (다크 모드 포함)
- 움직임을 줄이는 설정(`prefers-reduced-motion`)을 존중합니다.

---

## 9. 마일스톤 (진행 순서)

각 마일스톤이 끝나면 직접 확인하고 커밋한 뒤 다음으로 넘어갑니다.

### 마일스톤 0. 프로젝트 세팅 (반나절)

- [x] GitHub에 `sliding-puzzle` 빈 저장소 생성
- [x] npm workspaces 루트 + `shared`, `client`(Vite React TS), `server`(Express TS) 생성
- [x] oxlint, Prettier, Vitest 설정, 루트에서 `npm test`로 전체 실행되게 구성
- [x] README 초안, 첫 커밋과 push

### 마일스톤 1. 게임 로직 (shared) (반나절~1일)

- [ ] `constants.ts` (SIZES = [3, 4, 5], 크기별 섞기 횟수)
- [ ] `prng.ts`, `shuffle.ts` (시드 기반, 직전 이동 되돌리기 방지)
- [ ] `board.ts` (createSolved, canMove, move, isSolved)
- [ ] `replay.ts` (이동 기록 재생과 검증)
- [ ] 테스트: 같은 시드는 같은 배치, 섞인 배치가 항상 풀리는지(역재생), 잘못된 이동 거부, 완성 판정

### 마일스톤 2. 연습 모드 게임 화면 (client) (1일)

- [ ] Board / Tile 컴포넌트, 크기 선택, 이동 횟수·타이머, 방향키·클릭 조작
- [ ] 완성 시 결과 화면, 다시 하기
- [ ] 이동 애니메이션, 반응형, 접근성
- [ ] 이 단계에서는 서버 없이도 완전히 플레이 가능 (연습 모드)

### 마일스톤 3. 서버 기본과 DB (1일)

- [ ] DB 준비 (Docker 또는 Neon), Prisma 스키마와 첫 마이그레이션
- [ ] Express 앱 기본 구성 (helmet, cors, JSON 파싱, 에러 핸들러, 헬스체크 `GET /api/health`)
- [ ] `app.ts` / `index.ts` 분리, Supertest로 헬스체크 테스트

### 마일스톤 4. 인증 (1일)

- [ ] 회원가입 / 로그인 / 로그아웃 / me API (bcrypt, JWT 쿠키, Zod 검증)
- [ ] `requireAuth` 미들웨어, 로그인 rate limit
- [ ] 클라이언트 로그인 / 회원가입 화면과 `useAuth`
- [ ] API 테스트: 중복 아이디, 틀린 비밀번호, 인증 없는 접근

### 마일스톤 5. 게임 기록 저장과 검증 (1~2일)

- [ ] `POST /api/games`, `finish`, `abandon` 구현 (서버 재생 검증 포함)
- [ ] `GET /api/games`, `DELETE /api/games/:id` (소유자 검사)
- [ ] 클라이언트 연동: 게임 시작 시 서버에서 시드 받기, 완료 시 이동 기록 제출
- [ ] API 테스트: 정상 완료, 조작된 이동 기록 거부, 남의 게임 접근 거부, 이중 제출 거부

### 마일스톤 6. 내 기록과 통계 (1일)

- [ ] `GET /api/stats` (크기별 최고 기록, 평균, 완료율, 최근 7일 추이)
- [ ] 내 기록 페이지: 최고 기록 카드, 추이 차트, 최근 기록 목록(삭제 포함)
- [ ] 빈 상태, 로딩, 에러 처리

### 마일스톤 7. 품질과 배포 (1일)

- [ ] 보안 점검 (rate limit, 입력 길이 제한, 환경변수, 쿠키 설정)
- [ ] 접근성 · 모바일 점검, Lighthouse
- [ ] 클라이언트 Vercel, 서버 Render, DB 배포와 환경변수 설정
- [ ] GitHub Actions로 린트 / 테스트 자동화
- [ ] README 완성 (구조도, 검증 설계, 한계, 트러블슈팅)

### 마일스톤 8. 도전 과제 (선택)

- [ ] 6×6 크기 추가 (상수 한 곳만 바꿔서 되는지 확인), 최적 이동 계산, 다시보기, 시드 공유

---

## 10. 테스트 계획

| 대상                    | 종류             | 예시                                                              |
| ----------------------- | ---------------- | ----------------------------------------------------------------- |
| `shuffle`               | 단위             | 같은 시드는 같은 배치, 결과가 이미 완성이 아님                    |
| 섞인 배치의 풀이 가능성 | 단위             | 섞는 데 쓴 이동을 거꾸로 하면 완성 상태로 돌아옴                  |
| `move` / `canMove`      | 단위             | 빈칸과 인접한 타일만 이동, 원본 배열은 변경되지 않음              |
| `replay`                | 단위             | 올바른 기록 통과, 불가능한 이동·미완성 기록 거부                  |
| 인증 API                | 통합 (Supertest) | 중복 가입 409, 잘못된 비밀번호 401, 쿠키 발급                     |
| 게임 API                | 통합             | 정상 완료 저장, 조작된 기록 400, 남의 게임 403/404, 이중 제출 409 |
| 통계                    | 통합             | 완료 / 포기 섞인 데이터로 최고 기록·완료율 계산                   |
| Board 컴포넌트          | 컴포넌트         | 클릭·방향키 이동, 완성 시 결과 표시                               |

통합 테스트는 **테스트용 DB**를 따로 쓰고, 테스트마다 데이터를 초기화합니다.

---

## 11. Git 규칙

- 커밋 메시지: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:` + 한국어 설명
- 마일스톤 단위로 브랜치를 만들고 PR로 머지하면 이력이 깔끔해집니다.
- **`.env`는 절대 커밋하지 않습니다.** `.env.example`에 키 이름만 적어 둡니다. (`DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN` 등)

---

## 12. README 작성 가이드

1. 프로젝트 소개, **배포 링크**, 스크린샷 또는 GIF
2. 주요 기능
3. 아키텍처 그림 (client - server - DB, shared 모듈)
4. 기술 스택과 **선택 이유**
5. **기록 검증 설계**와 그 한계
6. API 목록
7. 실행 방법 (환경변수 설정, DB 준비, `npm install`, `npm run dev`, `npm test`)
8. **트러블슈팅 기록** (최소 3개, 예: 풀 수 없는 퍼즐 문제, 쿠키 도메인 문제)
9. 개선 계획

---

## 13. 면접 대비 질문

- 왜 게임 로직을 `shared`로 분리했나요? 서버에서 다시 쓰는 이유는?
- 풀 수 없는 퍼즐이 나오지 않게 어떻게 섞었나요?
- 클라이언트가 보낸 기록을 왜 그대로 믿지 않았나요? 서버는 무엇을 검증하나요? 한계는?
- JWT를 localStorage 대신 httpOnly 쿠키에 둔 이유는?
- 비밀번호를 왜 해시하나요? bcrypt를 쓴 이유는?
- 남의 기록을 지우지 못하게 어떻게 막았나요?
- 같은 완료 요청이 두 번 들어오면 어떻게 되나요?
- 인덱스를 왜 `(userId, size, status)`에 걸었나요?
- 판 크기를 6×6으로 늘리려면 어디를 고치나요?
- 배포 후 쿠키 문제는 어떻게 해결했나요?

---

## 14. 최종 체크리스트

- [ ] 배포 링크에서 회원가입 → 게임 → 기록 저장 → 내 기록 확인까지 동작한다
- [ ] 모바일에서도 플레이 가능하다
- [ ] 로딩 / 에러 / 빈 상태가 모두 처리되어 있다
- [ ] 조작된 이동 기록과 남의 기록 접근이 서버에서 거부된다
- [ ] `.env`와 비밀 값이 저장소에 없다
- [ ] `npm run lint`, `npm test`가 통과하고 CI도 통과한다
- [ ] 커밋 이력이 의미 단위로 정리되어 있다
- [ ] README에 설계 이유, 검증의 한계, 트러블슈팅이 있다
- [ ] 스크린샷 또는 데모 GIF가 있다

---

## 부록. Claude Code에게 요청하는 방법 (예시)

```
SPEC.md를 읽고 마일스톤 0을 진행해줘. 끝나면 무엇을 했는지 알려주고 멈춰줘.
```

```
마일스톤 1의 shuffle과 replay를 구현하고, 풀 수 있는 퍼즐인지 검증하는 테스트도 같이 작성해줘.
```

```
방금 만든 finish API에서 조작된 요청으로 기록을 속일 수 있는 부분이 있는지 보안 관점에서 리뷰해줘.
```

> 팁: 코드를 그대로 받아 쓰기보다, 만들어진 코드를 읽고 "왜 이렇게 했는지" 설명할 수 있을 때까지 질문하세요. 특히 **기록 검증**과 **인증** 부분은 면접에서 반드시 설명하게 됩니다.
