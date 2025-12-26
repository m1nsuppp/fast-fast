/**
 * Fastify 생명주기(Lifecycle) 예제
 *
 * 요청 처리 순서:
 * 1. onRequest      - 요청 수신 직후 (인증, 로깅)
 * 2. preParsing     - 바디 파싱 전 (스트림 조작)
 * 3. preValidation  - 스키마 검증 전 (데이터 변환)
 * 4. preHandler     - 핸들러 실행 전 (권한 체크)
 * 5. handler        - 실제 라우트 핸들러
 * 6. preSerialization - 응답 직렬화 전 (응답 수정)
 * 7. onSend         - 응답 전송 직전 (헤더 추가)
 * 8. onResponse     - 응답 완료 후 (로깅, 정리)
 *
 * 에러 발생 시:
 * - onError         - 에러 처리
 *
 * 서버 생명주기:
 * - onReady         - 서버 시작 준비 완료
 * - onClose         - 서버 종료 시
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';

function lifecyclePlugin(fastify: FastifyInstance): void {
  // ============================================
  // 요청 생명주기 훅
  // ============================================

  // 1. onRequest - 가장 먼저 실행
  fastify.addHook('onRequest', (request: FastifyRequest, _reply, done) => {
    request.log.info(`[1. onRequest] ${request.method} ${request.url}`);
    done();
  });

  // 2. preParsing - 바디 파싱 전
  fastify.addHook('preParsing', (request, _reply, payload, done) => {
    request.log.info('[2. preParsing] 바디 파싱 전');
    done(null, payload); // 페이로드를 그대로 반환하거나 수정
  });

  // 3. preValidation - 스키마 검증 전
  fastify.addHook('preValidation', (request, _reply, done) => {
    request.log.info('[3. preValidation] 스키마 검증 전');
    done();
  });

  // 4. preHandler - 핸들러 실행 전
  fastify.addHook('preHandler', (request, _reply, done) => {
    request.log.info('[4. preHandler] 핸들러 실행 전');
    done();
  });

  // (5. handler는 라우트에서 정의)

  // 6. preSerialization - 응답 직렬화 전
  fastify.addHook('preSerialization', (request, _reply, payload, done) => {
    request.log.info('[6. preSerialization] 응답 직렬화 전');
    done(null, payload); // 페이로드 수정 가능
  });

  // 7. onSend - 응답 전송 직전
  fastify.addHook('onSend', (request, reply, payload, done) => {
    request.log.info('[7. onSend] 응답 전송 직전');
    // 커스텀 헤더 추가
    void reply.header('X-Response-Time', `${Date.now()}ms`);
    done(null, payload);
  });

  // 8. onResponse - 응답 완료 후
  fastify.addHook('onResponse', (request, reply, done) => {
    request.log.info(`[8. onResponse] 응답 완료 - ${reply.statusCode}`);
    done();
  });

  // ============================================
  // 에러 훅
  // ============================================
  fastify.addHook('onError', (request, _reply, error, done) => {
    request.log.error(`[onError] 에러 발생: ${error.message}`);
    done();
  });

  // ============================================
  // 서버 생명주기 훅
  // ============================================
  fastify.addHook('onReady', (done) => {
    fastify.log.info('[onReady] 서버 준비 완료!');
    done();
  });

  fastify.addHook('onClose', (instance, done) => {
    instance.log.info('[onClose] 서버 종료 중...');
    done();
  });

  fastify.log.info('[Lifecycle] 생명주기 훅 등록 완료');
}

export default fp(lifecyclePlugin, {
  name: 'lifecycle',
});
