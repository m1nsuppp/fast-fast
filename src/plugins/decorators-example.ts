/**
 * 데코레이터 패턴 예제
 *
 * 3가지 데코레이터:
 * 1. decorate        - FastifyInstance에 추가 (app.xxx)
 * 2. decorateRequest - Request 객체에 추가 (request.xxx)
 * 3. decorateReply   - Reply 객체에 추가 (reply.xxx)
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// HTTP 상태 코드 상수
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
} as const;

// ============================================
// TypeScript 타입 확장
// ============================================
declare module 'fastify' {
  interface FastifyInstance {
    config: {
      env: string;
      version: string;
    };
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user: {
      id: number;
      name: string;
      role: string;
    } | null;
    startTime: number;
  }

  interface FastifyReply {
    success: (data: unknown) => FastifyReply;
    error: (message: string, statusCode?: number) => FastifyReply;
  }
}

function decoratorsPlugin(fastify: FastifyInstance): void {
  // ============================================
  // 1. decorate - 앱 인스턴스에 추가
  // ============================================
  fastify.decorate('config', {
    env: process.env.NODE_ENV ?? 'development',
    version: '1.0.0',
  });

  // 함수도 데코레이터로 추가 가능
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const authHeader = request.headers.authorization;

      if (authHeader === undefined) {
        await reply.error('인증이 필요합니다', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      if (!authHeader.startsWith('Bearer ')) {
        await reply.error('인증이 필요합니다', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      // 실제로는 JWT 검증 등
      const token = authHeader.slice(7);
      if (token === 'valid-token') {
        // eslint-disable-next-line no-param-reassign -- request.user는 의도적으로 설정해야 함
        request.user = { id: 1, name: '테스트 사용자', role: 'admin' };
      } else {
        await reply.error('유효하지 않은 토큰입니다', HTTP_STATUS.UNAUTHORIZED);
      }
    },
  );

  // ============================================
  // 2. decorateRequest - Request에 추가
  // ============================================
  // 초기값은 null (각 요청에서 설정됨)
  fastify.decorateRequest('user', null);
  fastify.decorateRequest('startTime', 0);

  // ============================================
  // 3. decorateReply - Reply에 추가
  // ============================================
  // 응답 헬퍼 메서드
  fastify.decorateReply('success', function (this: FastifyReply, data: unknown) {
    return this.send({
      success: true,
      data,
    });
  });

  fastify.decorateReply(
    'error',
    function (this: FastifyReply, message: string, statusCode = HTTP_STATUS.BAD_REQUEST) {
      return this.status(statusCode).send({
        success: false,
        error: message,
      });
    },
  );

  fastify.log.info('[Decorators] 데코레이터 등록 완료');
}

export default fp(decoratorsPlugin, {
  name: 'decorators',
});
