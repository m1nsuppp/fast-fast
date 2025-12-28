# Fast-Fast: Fastify 학습 프로젝트

Fastify 프레임워크를 체계적으로 학습하기 위한 프로젝트입니다.

## 시작하기

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

---

# Fastify 학습 로드맵

## Phase 1: 핵심 개념 이해

### 1.1 Fastify 아키텍처 이해

- **캡슐화(Encapsulation)** - Fastify의 핵심 설계 철학
- **플러그인 시스템** - 모든 것이 플러그인이다
- **데코레이터 패턴** - `decorate`, `decorateRequest`, `decorateReply`
- **생명주기(Lifecycle)** - 요청/응답 훅 순서

### 1.2 라우팅 기초

- HTTP 메서드별 라우트 정의
- 경로 파라미터 (`/users/:id`)
- 쿼리스트링 처리
- 와일드카드 라우트

---

## Phase 2: 검증과 직렬화

### 2.1 JSON Schema 검증

```typescript
// 요청 검증
app.post(
  '/users',
  {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
    },
  },
  handler,
);
```

### 2.2 응답 직렬화

- `fast-json-stringify` 활용
- 응답 스키마 정의로 성능 최적화

---

## Phase 3: 플러그인 시스템 마스터

### 3.1 플러그인 작성

```typescript
import fp from 'fastify-plugin';

export default fp(
  async (fastify, opts) => {
    fastify.decorate('utility', () => {});
  },
  { name: 'my-plugin' },
);
```

### 3.2 공식 플러그인 학습

| 플러그인             | 용도             |
| -------------------- | ---------------- |
| `@fastify/cors`      | CORS 처리        |
| `@fastify/helmet`    | 보안 헤더        |
| `@fastify/swagger`   | API 문서화       |
| `@fastify/jwt`       | JWT 인증         |
| `@fastify/cookie`    | 쿠키 처리        |
| `@fastify/formbody`  | form 데이터 파싱 |
| `@fastify/multipart` | 파일 업로드      |

---

## Phase 4: 훅(Hooks)과 생명주기

### 4.1 요청 생명주기 순서

```
onRequest → preParsing → preValidation → preHandler → handler → preSerialization → onSend → onResponse
```

### 4.2 주요 훅 활용

- `onRequest` - 인증/인가 검사
- `preHandler` - 비즈니스 로직 전 데이터 준비
- `onError` - 에러 핸들링
- `onClose` - 서버 종료 시 정리 작업

---

## Phase 5: 타입 안전성 (TypeScript)

### 5.1 타입 Provider

```typescript
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

const app = Fastify().withTypeProvider<TypeBoxTypeProvider>();
```

### 5.2 타입 추론

- 요청 파라미터 타입 추론
- 응답 타입 강제
- 제네릭 활용

---

## Phase 6: 아키텍처 패턴

### 6.1 프로젝트 구조화

```
src/
├── plugins/        # 공통 플러그인
├── routes/         # 라우트 정의
├── services/       # 비즈니스 로직
├── schemas/        # JSON 스키마
└── app.ts          # 앱 팩토리
```

### 6.2 의존성 주입

- 데코레이터를 통한 서비스 주입
- 테스트 용이한 구조 설계

---

## Phase 7: 고급 주제

### 7.1 성능 최적화

- 커넥션 풀링
- 스트리밍 응답
- 클러스터 모드

### 7.2 테스트

- `inject()` 메서드로 통합 테스트
- 플러그인 격리 테스트

### 7.3 에러 처리

- 커스텀 에러 핸들러
- `setErrorHandler` 활용

---

## 추천 학습 순서

1. **공식 문서 정독**: https://fastify.dev/docs/latest/
2. **Phase 1-2** 완료 후 간단한 CRUD API 구현
3. **Phase 3-4** 완료 후 인증이 포함된 API 구현
4. **Phase 5-6** 완료 후 실제 서비스 수준의 프로젝트 구성
5. **Phase 7** 프로덕션 배포 준비

---

## 핵심 원칙

- **추상화에 의존** → Fastify 플러그인으로 구현체 숨기기
- **테스트 가능성** → `inject()` 메서드와 플러그인 캡슐화
- **단순하게 유지** → Fastify의 미니멀한 설계
- **입증된 기술 사용** → Fastify는 Node.js에서 가장 빠른 프레임워크 중 하나
