/**
 * 데이터베이스 플러그인 예제
 *
 * 실제 프로젝트에서 DB 연결을 관리하는 패턴을 보여줍니다.
 * 플러그인 시스템의 장점:
 * 1. 의존성 관리 (dependencies)
 * 2. 생명주기 훅 (onClose로 연결 정리)
 * 3. 타입 안전성 (declare module로 타입 확장)
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

// 가상의 DB 클라이언트 (실제로는 prisma, drizzle, pg 등)
interface DatabaseClient {
  query: <T>(sql: string) => Promise<T[]>;
  close: () => Promise<void>;
}

// TypeScript: FastifyInstance 타입 확장
declare module 'fastify' {
  interface FastifyInstance {
    db: DatabaseClient;
  }
}

interface DatabasePluginOptions {
  connectionString?: string;
}

function databasePlugin(
  fastify: FastifyInstance,
  options: DatabasePluginOptions,
): void {
  const connectionString =
    options.connectionString ?? 'postgres://localhost:5432/mydb';

  // 가상의 DB 연결 생성
  const client: DatabaseClient = {
    query: async <T>(sql: string): Promise<T[]> => {
      fastify.log.info(`[DB] Executing: ${sql}`);
      // 실제로는 여기서 DB 쿼리 실행
      return await Promise.resolve([] as T[]);
    },
    close: async (): Promise<void> => {
      fastify.log.info('[DB] Connection closed');
      await Promise.resolve();
    },
  };

  // 데코레이터로 등록 (어디서든 fastify.db로 접근)
  fastify.decorate('db', client);

  // 서버 종료 시 연결 정리
  fastify.addHook('onClose', async () => {
    await client.close();
  });

  fastify.log.info(`[DB] Connected to ${connectionString}`);
}

export default fp(databasePlugin, {
  name: 'database',
  // 이 플러그인이 먼저 등록되어야 함을 명시
  // dependencies: ['other-plugin'],
});
