/**
 * Phase 2.1: JSON Schema 검증 예제
 *
 * Fastify는 JSON Schema를 사용하여 요청을 검증합니다.
 * - body: 요청 본문 검증
 * - params: 경로 파라미터 검증
 * - querystring: 쿼리스트링 검증
 * - headers: 헤더 검증
 *
 * 검증에 실패하면 자동으로 400 Bad Request를 반환합니다.
 */

import type { FastifyPluginAsync, FastifyError } from 'fastify';

// ========================================
// 스키마 정의
// ========================================

// 사용자 생성 요청 스키마
const createUserSchema = {
  body: {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        description: '사용자 이름 (2-50자)',
      },
      email: {
        type: 'string',
        format: 'email',
        description: '이메일 주소',
      },
      age: {
        type: 'integer',
        minimum: 0,
        maximum: 150,
        description: '나이 (선택사항)',
      },
      role: {
        type: 'string',
        enum: ['admin', 'user', 'guest'],
        default: 'user',
        description: '사용자 역할',
      },
    },
    additionalProperties: false, // 정의되지 않은 속성 거부
  },
} as const;

// 경로 파라미터 스키마
const paramsSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        pattern: '^[0-9]+$', // 숫자만 허용
        description: '사용자 ID',
      },
    },
  },
} as const;

// 쿼리스트링 스키마
const querystringSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: '페이지 번호',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 10,
        description: '페이지당 항목 수',
      },
      sort: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc',
        description: '정렬 순서',
      },
      search: {
        type: 'string',
        minLength: 1,
        description: '검색어 (선택사항)',
      },
    },
  },
} as const;

// 헤더 검증 스키마
const headersSchema = {
  headers: {
    type: 'object',
    required: ['x-api-key'],
    properties: {
      'x-api-key': {
        type: 'string',
        minLength: 10,
        description: 'API 키',
      },
      'x-request-id': {
        type: 'string',
        format: 'uuid',
        description: '요청 추적 ID (선택사항)',
      },
    },
  },
} as const;

// 복합 스키마 (여러 검증 조합)
const updateUserSchema = {
  params: paramsSchema.params,
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
      },
      email: {
        type: 'string',
        format: 'email',
      },
      age: {
        type: 'integer',
        minimum: 0,
        maximum: 150,
      },
    },
    // 최소 하나의 필드는 있어야 함
    minProperties: 1,
    additionalProperties: false,
  },
} as const;

// ========================================
// 플러그인 정의
// ========================================

const validationExamples: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /validation/users
   *
   * Body 검증 예제
   * - name: 필수, 2-50자
   * - email: 필수, 이메일 형식
   * - age: 선택, 0-150 정수
   * - role: 선택, enum 값
   */
  fastify.post(
    '/users',
    {
      schema: createUserSchema,
    },
    async (request, reply) => {
      const { name, email, age, role } = request.body as {
        name: string;
        email: string;
        age?: number;
        role?: string;
      };

      // 검증을 통과한 데이터로 비즈니스 로직 수행
      return {
        success: true,
        message: '사용자가 생성되었습니다',
        user: {
          id: Math.floor(Math.random() * 1000),
          name,
          email,
          age: age ?? null,
          role: role ?? 'user',
          createdAt: new Date().toISOString(),
        },
      };
    },
  );

  /**
   * GET /validation/users/:id
   *
   * 경로 파라미터 검증 예제
   * - id: 숫자만 허용
   */
  fastify.get<{ Params: { id: string } }>(
    '/users/:id',
    {
      schema: paramsSchema,
    },
    async (request) => {
      const { id } = request.params;

      return {
        success: true,
        user: {
          id: parseInt(id, 10),
          name: 'Example User',
          email: 'user@example.com',
        },
      };
    },
  );

  /**
   * GET /validation/users
   *
   * 쿼리스트링 검증 예제
   * - page: 1 이상 정수 (기본값: 1)
   * - limit: 1-100 정수 (기본값: 10)
   * - sort: 'asc' 또는 'desc' (기본값: 'desc')
   * - search: 검색어 (선택)
   */
  fastify.get<{
    Querystring: {
      page?: number;
      limit?: number;
      sort?: string;
      search?: string;
    };
  }>(
    '/users',
    {
      schema: querystringSchema,
    },
    async (request) => {
      const { page = 1, limit = 10, sort = 'desc', search } = request.query;

      return {
        success: true,
        pagination: {
          page,
          limit,
          sort,
          search: search ?? null,
        },
        users: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
        ],
      };
    },
  );

  /**
   * GET /validation/protected
   *
   * 헤더 검증 예제
   * - x-api-key: 필수, 최소 10자
   * - x-request-id: 선택, UUID 형식
   */
  fastify.get<{
    Headers: {
      'x-api-key': string;
      'x-request-id'?: string;
    };
  }>(
    '/protected',
    {
      schema: headersSchema,
    },
    async (request) => {
      const apiKey = request.headers['x-api-key'];
      const requestId = request.headers['x-request-id'];

      return {
        success: true,
        message: 'API 키가 유효합니다',
        apiKeyPrefix: apiKey?.substring(0, 4) + '****',
        requestId: requestId ?? 'not-provided',
      };
    },
  );

  /**
   * PUT /validation/users/:id
   *
   * 복합 검증 예제 (params + body)
   */
  fastify.put<{
    Params: { id: string };
    Body: { name?: string; email?: string; age?: number };
  }>(
    '/users/:id',
    {
      schema: updateUserSchema,
    },
    async (request) => {
      const { id } = request.params;
      const updates = request.body;

      return {
        success: true,
        message: '사용자가 업데이트되었습니다',
        user: {
          id: parseInt(id, 10),
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      };
    },
  );

  /**
   * 커스텀 에러 메시지 예제
   *
   * setErrorHandler로 검증 에러를 커스터마이즈할 수 있습니다.
   */
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    // 검증 에러인 경우
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'Validation Error',
        message: '요청 데이터가 올바르지 않습니다',
        details: error.validation.map((err) => ({
          field: err.instancePath || err.params?.missingProperty || 'unknown',
          message: err.message,
          keyword: err.keyword,
        })),
      });
    }

    // 기타 에러
    return reply.status(error.statusCode ?? 500).send({
      success: false,
      error: error.name,
      message: error.message,
    });
  });
};

export default validationExamples;
