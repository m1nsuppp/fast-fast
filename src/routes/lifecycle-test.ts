/**
 * 생명주기 테스트 라우트
 */

import type { FastifyInstance } from 'fastify';

export default function lifecycleTestRoutes(fastify: FastifyInstance): void {
  // 정상 요청 - 모든 훅 실행
  fastify.get('/normal', (request, reply) => {
    request.log.info('[5. handler] 핸들러 실행');
    void reply.send({ message: '정상 응답' });
  });

  // 에러 발생 - onError 훅 테스트
  fastify.get('/error', (_request, reply) => {
    void reply.send(new Error('의도적인 에러'));
  });

  // preHandler에서 조기 응답
  fastify.get(
    '/early-response',
    {
      preHandler: (_request, reply, done) => {
        // reply.send()를 호출하면 핸들러가 실행되지 않음
        void reply.send({ message: 'preHandler에서 조기 응답' });
        done();
      },
    },
    () => ({
      // 이 핸들러는 실행되지 않음
      message: '이 메시지는 보이지 않음',
    }),
  );
}
