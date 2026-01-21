/**
 * 라우팅 기초 예제
 *
 * 다루는 내용:
 * 1. HTTP 메서드별 라우트
 * 2. 경로 파라미터 (:id)
 * 3. 쿼리스트링
 * 4. 와일드카드 (*)
 * 5. 정규표현식 파라미터
 * 6. 라우트 옵션
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';

const HTTP_STATUS = {
  CREATED: 201,
  NO_CONTENT: 204,
  NOT_FOUND: 404,
} as const;

const DEFAULT_LIMIT = 10;
const NOT_FOUND_INDEX = -1;

// 타입 정의
interface PostParams {
  id: string;
}

interface PostQuery {
  sort?: 'asc' | 'desc';
  limit?: string;
}

interface PostBody {
  title: string;
  content: string;
}

// 가상 데이터
const posts = [
  { id: 1, title: '첫 번째 포스트', content: 'Hello World!' },
  { id: 2, title: '두 번째 포스트', content: 'Fastify is awesome!' },
  { id: 3, title: '세 번째 포스트', content: 'Learning routing...' },
];

export default function routingExamples(fastify: FastifyInstance): void {
  // ============================================
  // 1. HTTP 메서드별 라우트
  // ============================================

  // GET - 리소스 조회
  fastify.get('/posts', () => ({ posts }));

  // POST - 리소스 생성
  fastify.post<{ Body: PostBody }>('/posts', (request, reply) => {
    const { title, content } = request.body;
    const newPost = { id: posts.length + 1, title, content };
    posts.push(newPost);
    void reply.status(HTTP_STATUS.CREATED).send({ post: newPost });
  });

  // PUT - 리소스 전체 수정
  fastify.put<{ Params: PostParams; Body: PostBody }>(
    '/posts/:id',
    (request, reply) => {
      const { id } = request.params;
      const { title, content } = request.body;
      const postIndex = posts.findIndex((p) => p.id === Number(id));

      if (postIndex === NOT_FOUND_INDEX) {
        void reply.status(HTTP_STATUS.NOT_FOUND).send({ error: '포스트를 찾을 수 없습니다' });
        return;
      }

      posts[postIndex] = { id: Number(id), title, content };
      void reply.send({ post: posts[postIndex] });
    },
  );

  // PATCH - 리소스 부분 수정
  fastify.patch<{ Params: PostParams; Body: Partial<PostBody> }>(
    '/posts/:id',
    (request, reply) => {
      const { id } = request.params;
      const postIndex = posts.findIndex((p) => p.id === Number(id));

      if (postIndex === NOT_FOUND_INDEX) {
        void reply.status(HTTP_STATUS.NOT_FOUND).send({ error: '포스트를 찾을 수 없습니다' });
        return;
      }

      posts[postIndex] = { ...posts[postIndex], ...request.body };
      void reply.send({ post: posts[postIndex] });
    },
  );

  // DELETE - 리소스 삭제
  fastify.delete<{ Params: PostParams }>(
    '/posts/:id',
    (request, reply) => {
      const { id } = request.params;
      const postIndex = posts.findIndex((p) => p.id === Number(id));

      if (postIndex === NOT_FOUND_INDEX) {
        void reply.status(HTTP_STATUS.NOT_FOUND).send({ error: '포스트를 찾을 수 없습니다' });
        return;
      }

      posts.splice(postIndex, 1);
      void reply.status(HTTP_STATUS.NO_CONTENT).send();
    },
  );

  // ============================================
  // 2. 경로 파라미터
  // ============================================

  // 단일 파라미터
  fastify.get<{ Params: PostParams }>('/posts/:id', (request, reply) => {
    const { id } = request.params;
    const post = posts.find((p) => p.id === Number(id));

    if (post === undefined) {
      void reply.status(HTTP_STATUS.NOT_FOUND).send({ error: '포스트를 찾을 수 없습니다' });
      return;
    }

    void reply.send({ post });
  });

  // 다중 파라미터
  fastify.get<{ Params: { year: string; month: string; day: string } }>(
    '/archive/:year/:month/:day',
    (request) => {
      const { year, month, day } = request.params;

      return {
        date: `${year}-${month}-${day}`,
        message: `${year}년 ${month}월 ${day}일의 아카이브`,
      };
    },
  );

  // ============================================
  // 3. 쿼리스트링
  // ============================================

  fastify.get<{ Querystring: PostQuery }>(
    '/posts-query',
    (request) => {
      const { sort = 'asc', limit = String(DEFAULT_LIMIT) } = request.query;

      let result = [...posts];

      if (sort === 'desc') {
        result.reverse();
      }

      const limitNum = parseInt(limit, DEFAULT_LIMIT);
      result = result.slice(0, limitNum);

      return {
        query: { sort, limit: limitNum },
        posts: result,
      };
    },
  );

  // ============================================
  // 4. 와일드카드 라우트
  // ============================================

  // * - 경로의 나머지 부분 매칭
  fastify.get<{ Params: { '*': string } }>('/files/*', (request) => {
    const fullPath = request.params['*'];

    return {
      message: '파일 경로 매칭',
      path: fullPath,
    };
  });

  // ============================================
  // 5. 라우트 옵션
  // ============================================

  // 전체 옵션 사용 예제
  fastify.route({
    method: 'GET',
    url: '/full-options',
    // 스키마로 요청/응답 검증
    schema: {
      querystring: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            hello: { type: 'string' },
          },
        },
      },
    },
    // 핸들러 전 실행
    preHandler: (request: FastifyRequest, _reply, done) => {
      request.log.info('preHandler in route options');
      done();
    },
    // 실제 핸들러
    handler: async (request, reply) => {
      const query = request.query as { name?: string };
      return reply.send({ hello: query.name ?? 'World' });
    },
  });

  // ============================================
  // 6. 단축 문법
  // ============================================

  // 여러 메서드 동시 처리
  fastify.route({
    method: ['GET', 'HEAD'],
    url: '/ping',
    handler: (_request, reply) => {
      void reply.send({ pong: true });
    },
  });
}
