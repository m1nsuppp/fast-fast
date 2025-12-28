/**
 * 공유 플러그인 (캡슐화를 깨는 경우)
 *
 * `fastify-plugin`으로 감싸면 캡슐화가 "깨지고"
 * 부모 컨텍스트에서도 이 플러그인의 데코레이터, 훅 등에 접근할 수 있습니다.
 *
 * 사용 사례:
 * - 데이터베이스 연결 (모든 라우트에서 접근 필요)
 * - 공통 유틸리티 함수
 * - 인증/인가 데코레이터
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

// TypeScript: 데코레이터 타입 확장
declare module 'fastify' {
  interface FastifyInstance {
    sharedValue: string;
    utility: {
      formatDate: (date: Date) => string;
    };
  }
}

function sharedPluginImpl(fastify: FastifyInstance): void {
  // 이 데코레이터는 모든 곳에서 접근 가능 (캡슐화 깨짐)
  fastify.decorate('sharedValue', '공유된 값 - 어디서든 접근 가능');

  fastify.decorate('utility', {
    formatDate: (date: Date) => date.toISOString().split('T')[0],
  });

  fastify.log.info('[sharedPlugin] 공유 플러그인 등록 완료');
}

/**
 * fp()로 감싸면:
 * - 캡슐화가 깨져서 부모 스코프에 노출됨
 * - name: 플러그인 식별자 (중복 등록 방지)
 * - dependencies: 이 플러그인이 의존하는 다른 플러그인들
 */
export default fp(sharedPluginImpl, {
  name: 'shared-plugin',
});
