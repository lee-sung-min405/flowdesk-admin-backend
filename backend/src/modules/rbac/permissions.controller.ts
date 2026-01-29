import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CatalogResponseDto } from './dto/catalog-response.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';

@ApiTags('Permissions')
@ApiBearerAuth('JWT')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('catalog')
  @RequireAuth('permissions', 'read')
  @ApiOperation({
    summary: '권한 카탈로그 조회 (테넌트 관리자 전용)',
    description: `
테넌트 관리자가 역할에 권한을 할당하기 위해 시스템에서 사용 가능한 권한 목록을 조회합니다.
관리자 UI에서 권한 매트릭스를 렌더링하기 위한 전체 카탈로그를 한 번에 제공합니다.

**대상 사용자:**
- 테넌트 관리자 (자신의 테넌트 내에서 역할 생성 및 권한 할당)

**인증 요구사항:**
- JWT 액세스 토큰 필수 (Authorization: Bearer <token>)
- 권한: permissions.read (권한 카탈로그 조회 권한)

**특징:**
- N+1 쿼리 방지 (총 3번의 쿼리로 모든 데이터 조회)
- is_active=1인 레코드만 반환
- 페이지: sort_order ASC (NULL은 뒤로), page_name ASC 정렬
- 액션: action_name ASC 정렬
- matrix: 페이지별 액션 목록 (UI에서 permission_id 직접 사용 가능)

**응답 구조:**
- pages: 전체 페이지 목록
- actions: 전체 액션 목록
- permissions: 전체 권한 목록
- matrix: { [page_name]: [{ actionName, permissionId }] } 형태

**사용 예시:**
프론트엔드에서 role_permission 저장 시 matrix의 permissionId를 직접 사용하여 추가 매핑 작업 불필요
    `,
  })
  @ApiOkResponse({
    description: '권한 카탈로그 조회 성공',
    type: CatalogResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패 (AUTH001) - 토큰 없음/만료/위조',
    type: StandardErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101) - permissions.read 권한 필요',
    type: StandardErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: '서버 오류 (SYS001) - 데이터베이스 연결 실패 등',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'SYS001',
          message: 'Internal server error',
          statusCode: 500,
        },
        meta: {
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/rbac/catalog',
        },
      },
    },
  })
  async getCatalog(): Promise<CatalogResponseDto> {
    return this.permissionsService.getCatalog();
  }
}
