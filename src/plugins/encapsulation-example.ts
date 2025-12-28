/**
 * Fastify 캡슐화(Encapsulation) 예제
 *
 * 핵심 개념:
 * 1. Fastify는 기본적으로 플러그인 내부에서 등록한 것들을 "캡슐화"합니다
 * 2. 자식 컨텍스트는 부모의 것을 상속받지만, 부모는 자식의 것을 알 수 없습니다
 * 3. `fastify-plugin`으로 감싸면 캡슐화를 "깨고" 부모 컨텍스트에 노출됩니다
 */

import type { FastifyInstance } from 'fastify';

/**
 * 캡슐화된 플러그인 (기본 동작)
 * - 이 플러그인 내부에서 등록한 데코레이터, 훅, 라우트는 외부에서 접근 불가
 */
export function encapsulatedPlugin(fastify: FastifyInstance): void {
  // 이 데코레이터는 이 플러그인과 하위 플러그인에서만 접근 가능
  fastify.decorate('encapsulatedValue', '캡슐화된 값');

  fastify.get('/encapsulated', () => ({
    message: '이 라우트는 캡슐화된 플러그인 내부에 있습니다',
  }));

  fastify.log.info('[encapsulatedPlugin] 등록 완료');
}

/**
 * 자식 플러그인 예제
 * - 부모 컨텍스트의 데코레이터에 접근 가능
 */
export function childPlugin(fastify: FastifyInstance): void {
  fastify.get('/child', () => ({
    // 부모에서 등록한 데코레이터에 접근 가능
    message: '자식 플러그인입니다',
  }));

  fastify.log.info('[childPlugin] 등록 완료');
}
