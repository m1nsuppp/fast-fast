/**
 * Fastify 앱 팩토리
 *
 * 앱 인스턴스를 생성하는 팩토리 패턴을 사용합니다.
 * 이렇게 하면 테스트에서 새로운 인스턴스를 쉽게 만들 수 있습니다.
 */

import Fastify, { type FastifyInstance } from 'fastify';

// 플러그인들
import sharedPlugin from './plugins/shared-plugin.js';
import databasePlugin from './plugins/database.js';
import decoratorsPlugin from './plugins/decorators-example.js';
import lifecyclePlugin from './plugins/lifecycle-example.js';
import {
  encapsulatedPlugin,
  childPlugin,
} from './plugins/encapsulation-example.js';

// 라우트들
import userRoutes from './routes/users.js';
import authExampleRoutes from './routes/auth-example.js';
import lifecycleTestRoutes from './routes/lifecycle-test.js';
import routingExamples from './routes/routing-examples.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty', // 개발 환경에서 보기 좋은 로그
      },
    },
  });

  // ========================================
  // 1. 공유 플러그인 등록 (캡슐화 깨짐)
  // ========================================
  // fp()로 감싼 플러그인이므로 sharedValue는 어디서든 접근 가능
  await app.register(sharedPlugin);

  // 데이터베이스 플러그인 (옵션 전달 가능)
  await app.register(databasePlugin, {
    connectionString: 'postgres://localhost:5432/fastify_demo',
  });

  // 데코레이터 플러그인
  await app.register(decoratorsPlugin);

  // 생명주기 훅 플러그인
  await app.register(lifecyclePlugin);

  // 루트 레벨에서 sharedValue 접근 가능!
  app.get('/', () => ({
    message: 'Hello Fastify!',
    shared: app.sharedValue, // 공유 플러그인의 데코레이터
    today: app.utility.formatDate(new Date()),
  }));

  // ========================================
  // 2. 캡슐화된 플러그인 등록
  // ========================================
  // prefix로 라우트 그룹화
  await app.register(
    async (instance) => {
      // encapsulatedPlugin은 fp()로 감싸지 않았으므로
      // 여기서 등록한 것들은 이 스코프 내에서만 유효
      await instance.register(encapsulatedPlugin);

      // 자식 플러그인은 부모(encapsulatedPlugin)의 것에 접근 가능
      await instance.register(childPlugin);
    },
    { prefix: '/api' },
  );

  // ========================================
  // 캡슐화 테스트
  // ========================================
  app.get('/test-encapsulation', () => ({
    // sharedValue는 접근 가능 (fp로 감쌌으므로)
    sharedValue: app.sharedValue,
    // encapsulatedValue는 여기서 접근 불가!
    // 아래 줄의 주석을 해제하면 TypeScript 에러 발생
    // encapsulatedValue: app.encapsulatedValue,
    message: 'encapsulatedValue는 /api 스코프 내에서만 접근 가능합니다',
  }));

  // ========================================
  // 3. 라우트 플러그인 등록
  // ========================================
  // prefix 옵션으로 /users 경로에 마운트
  await app.register(userRoutes, { prefix: '/users' });

  // 인증 예제 라우트 (데코레이터 활용)
  await app.register(authExampleRoutes, { prefix: '/auth' });

  // 생명주기 테스트 라우트
  await app.register(lifecycleTestRoutes, { prefix: '/lifecycle' });

  // 라우팅 예제
  await app.register(routingExamples, { prefix: '/routing' });

  return await Promise.resolve(app);
}
