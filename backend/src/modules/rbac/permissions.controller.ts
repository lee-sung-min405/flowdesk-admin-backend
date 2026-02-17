import { Controller, Get, Req } from '@nestjs/common';
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
    summary: '권한 카탈로그 조회',
    description: `
역할에 권한을 할당하기 위해 사용 가능한 권한 목록을 조회합니다.
관리자 UI에서 권한 매트릭스를 렌더링하기 위한 전체 카탈로그를 한 번에 제공합니다.

**권한 범위:**
- 슈퍼 관리자 (tenantId=1): 시스템 권한 포함 (super.* 페이지의 모든 권한)
- 업체 관리자 (tenantId≠1): 테넌트 권한만 제공 (super.* 페이지 제외)

**인증 요구사항:**
- JWT 액세스 토큰 필수 (Authorization: Bearer <token>)
- 권한: permissions.read (권한 카탈로그 조회 권한)

**성능 최적화:**
- N+1 쿼리 방지 (총 3번의 쿼리로 모든 데이터 로드)
- 활성 상태 레코드만 반환 (is_active=1)

**정렬 규칙:**
- pages: sort_order ASC (NULL은 뒤로), page_name ASC
- actions: action_name ASC
- matrix: 페이지별 액션 목록 (UI에서 permission_id 직접 사용 가능)

**응답 구조:**
- pages: 페이지 목록 (pageId, pageName, displayName 등)
- actions: 액션 목록 (actionId, actionName, displayName)
- permissions: 권한 목록 (permissionId, pageId, actionId 매핑)
- matrix: { [page_name]: [{ actionName, permissionId }] } 형태로 UI 렌더링 최적화

**사용 예시:**
프론트엔드에서 역할에 권한 할당 시 matrix의 permissionId를 직접 사용하여 추가 매핑 작업 불필요
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
  async getCatalog(@Req() request: Request & { user: any }): Promise<CatalogResponseDto> {
    return this.permissionsService.getCatalog(request.user.tenantId);
  }
}
