/**
 * 사용자 라우트 플러그인
 *
 * 라우트도 플러그인입니다!
 * - 관련 라우트를 하나의 파일로 그룹화
 * - prefix 옵션으로 경로 접두사 설정
 * - 캡슐화로 라우트별 데코레이터/훅 분리 가능
 */

import type { FastifyInstance } from 'fastify';

const HTTP_STATUS = {
  CREATED: 201,
  NOT_FOUND: 404,
} as const;

// 가상의 사용자 데이터
const users = [
  { id: 1, name: '김철수', email: 'kim@example.com' },
  { id: 2, name: '이영희', email: 'lee@example.com' },
  { id: 3, name: '박민수', email: 'park@example.com' },
];

/**
 * 라우트 플러그인은 보통 fp()로 감싸지 않습니다.
 * 이유: 라우트별 훅이나 데코레이터가 다른 라우트에 영향을 주지 않도록
 */
export default function userRoutes(fastify: FastifyInstance): void {
  // 이 라우트 그룹에만 적용되는 훅
  fastify.addHook('onRequest', (request, _reply, done) => {
    request.log.info('[Users] Request received');
    done();
  });

  // GET /users
  fastify.get('/', () => ({ users }));

  // GET /users/:id
  fastify.get<{
    Params: { id: string };
  }>('/:id', (request, reply) => {
    const { id } = request.params;
    const user = users.find((u) => u.id === Number(id));

    if (user === undefined) {
      void reply.status(HTTP_STATUS.NOT_FOUND).send({ error: '사용자를 찾을 수 없습니다' });
      return;
    }

    void reply.send({ user });
  });

  // POST /users
  fastify.post<{
    Body: { name: string; email: string };
  }>('/', (request, reply) => {
    const { name, email } = request.body;
    const newUser = {
      id: users.length + 1,
      name,
      email,
    };
    users.push(newUser);

    void reply.status(HTTP_STATUS.CREATED).send({ user: newUser });
  });
}
