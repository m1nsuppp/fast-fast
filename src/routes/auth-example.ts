/**
 * 인증 예제 라우트
 *
 * 데코레이터 사용 예시:
 * - request.user (decorateRequest)
 * - reply.success/error (decorateReply)
 * - fastify.authenticate (decorate)
 */

import type { FastifyInstance } from 'fastify';

const HTTP_STATUS = {
  BAD_REQUEST: 400,
} as const;

export default function authExampleRoutes(fastify: FastifyInstance): void {
  // 요청 시작 시간 기록 (decorateRequest 활용)
  fastify.addHook('onRequest', (request, _reply, done) => {
    // eslint-disable-next-line no-param-reassign -- request.startTime은 의도적으로 설정해야 함
    request.startTime = Date.now();
    done();
  });

  // 공개 엔드포인트
  fastify.get('/public', (_request, reply) =>
    reply.success({
      message: '이 엔드포인트는 인증이 필요없습니다',
      config: fastify.config, // decorate로 추가한 config
    }),
  );

  // 인증이 필요한 엔드포인트
  fastify.get(
    '/protected',
    {
      // preHandler 훅에서 인증 체크
      preHandler: (request, reply, done) => {
        void fastify.authenticate(request, reply).then(() => {
          done();
        });
      },
    },
    (request, reply) => {
      const responseTime = Date.now() - request.startTime;

      return reply.success({
        message: '인증된 사용자만 볼 수 있습니다',
        user: request.user,
        responseTime: `${responseTime}ms`,
      });
    },
  );

  // 에러 응답 예제
  fastify.get('/error-example', (_request, reply) =>
    reply.error('의도적인 에러입니다', HTTP_STATUS.BAD_REQUEST),
  );
}
