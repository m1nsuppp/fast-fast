/**
 * Phase 2.2: 응답 직렬화(Serialization) 예제
 *
 * Fastify는 응답 스키마를 정의하면 fast-json-stringify를 사용하여
 * JSON 직렬화 성능을 2-3배 향상시킵니다.
 *
 * 응답 스키마의 장점:
 * 1. 성능 최적화: fast-json-stringify가 스키마 기반 직렬화 수행
 * 2. 보안: 스키마에 정의되지 않은 필드는 자동으로 제외됨
 * 3. 문서화: 응답 형식이 명확하게 정의됨
 * 4. 일관성: 항상 동일한 형식의 응답 보장
 */

import type { FastifyPluginAsync } from 'fastify';

// ========================================
// 응답 스키마 정의
// ========================================

// 단일 사용자 응답 스키마
const userResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    email: { type: 'string' },
    role: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  // 필수 필드 정의
  required: ['id', 'name', 'email'],
} as const;

// 사용자 목록 응답 스키마
const usersListResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: userResponseSchema,
    },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
  },
} as const;

// 단일 사용자 응답 (wrapper 포함)
const singleUserResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: userResponseSchema,
  },
} as const;

// 에러 응답 스키마
const errorResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
} as const;

// 상태별 응답 스키마 정의
const responseSchemas = {
  200: singleUserResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
} as const;

// ========================================
// 플러그인 정의
// ========================================

const serializationExamples: FastifyPluginAsync = async (fastify) => {
  // 예시 데이터
  const users = [
    {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
      // 민감한 데이터 (스키마에 없으므로 응답에서 제외됨)
      password: 'hashed_password_123',
      internalNotes: 'VIP customer',
    },
    {
      id: 2,
      name: 'Bob',
      email: 'bob@example.com',
      role: 'user',
      createdAt: '2024-01-02T00:00:00Z',
      password: 'hashed_password_456',
      internalNotes: 'Regular customer',
    },
    {
      id: 3,
      name: 'Charlie',
      email: 'charlie@example.com',
      role: 'guest',
      createdAt: '2024-01-03T00:00:00Z',
      password: 'hashed_password_789',
      internalNotes: 'New signup',
    },
  ];

  /**
   * GET /serialization/users
   *
   * 목록 응답 직렬화 예제
   * - response 스키마가 정의되어 fast-json-stringify 사용
   * - password, internalNotes 같은 민감 필드는 자동 제외
   */
  fastify.get<{
    Querystring: { page?: number; limit?: number };
  }>(
    '/users',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 10 },
          },
        },
        response: {
          200: usersListResponseSchema,
        },
      },
    },
    async (request) => {
      const page = request.query.page ?? 1;
      const limit = request.query.limit ?? 10;
      const total = users.length;

      return {
        success: true,
        data: users, // password, internalNotes가 포함되어 있지만 응답에서 제외됨
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },
  );

  /**
   * GET /serialization/users/:id
   *
   * 단일 응답 + 상태별 스키마 예제
   * - 200: 사용자 데이터
   * - 404: 에러 응답
   */
  fastify.get<{ Params: { id: string } }>(
    '/users/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', pattern: '^[0-9]+$' },
          },
        },
        response: responseSchemas,
      },
    },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      const user = users.find((u) => u.id === id);

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: `ID ${id}인 사용자를 찾을 수 없습니다`,
          },
        });
      }

      return {
        success: true,
        data: user, // 민감 필드는 자동 제외
      };
    },
  );

  /**
   * GET /serialization/benchmark
   *
   * 직렬화 성능 비교 데모
   * - response 스키마가 있으면 fast-json-stringify 사용
   * - 대량의 데이터에서 성능 차이가 두드러짐
   */
  fastify.get(
    '/benchmark',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              itemCount: { type: 'integer' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    value: { type: 'string' },
                    timestamp: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      // 대량의 데이터 생성
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        value: `item-${i + 1}`,
        timestamp: new Date().toISOString(),
        // 이 필드들은 스키마에 없으므로 제외됨
        secretField: 'should-not-appear',
        internalId: `internal-${i}`,
      }));

      return {
        message:
          'fast-json-stringify로 직렬화됨 (스키마에 없는 필드는 제외됨)',
        itemCount: data.length,
        data,
      };
    },
  );

  /**
   * GET /serialization/no-schema
   *
   * 스키마 없는 응답 (비교용)
   * - JSON.stringify 사용 (느림)
   * - 모든 필드가 그대로 응답됨 (보안 위험)
   */
  fastify.get('/no-schema', async () => {
    return {
      message: '스키마 없이 응답 - 모든 필드가 노출됨',
      user: users[0], // password, internalNotes도 그대로 노출!
      warning: 'password와 internalNotes 필드가 노출되고 있습니다!',
    };
  });

  /**
   * GET /serialization/nested
   *
   * 중첩 객체 직렬화 예제
   */
  fastify.get(
    '/nested',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              organization: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  departments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        members: {
                          type: 'array',
                          items: userResponseSchema,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      return {
        organization: {
          id: 1,
          name: 'Acme Corp',
          // 내부 필드 (스키마에 없음)
          internalCode: 'ACME-001',
          departments: [
            {
              id: 1,
              name: 'Engineering',
              budget: 1000000, // 스키마에 없음
              members: users.slice(0, 2),
            },
            {
              id: 2,
              name: 'Marketing',
              budget: 500000, // 스키마에 없음
              members: [users[2]],
            },
          ],
        },
      };
    },
  );

  /**
   * 응답 직렬화 관련 팁
   *
   * 1. 항상 response 스키마를 정의하세요
   *    - 성능 향상
   *    - 민감 데이터 자동 제외
   *    - API 문서 자동 생성 (swagger)
   *
   * 2. nullable 필드 처리
   *    { type: ['string', 'null'] } 또는
   *    { type: 'string', nullable: true }
   *
   * 3. 상태 코드별 스키마 정의
   *    response: { 200: successSchema, 400: errorSchema }
   *
   * 4. $ref를 사용한 스키마 재사용 (addSchema)
   */
};

export default serializationExamples;
