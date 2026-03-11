import {
  Controller,
  Get,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CounselFieldService } from './services/counsel-field.service';
import { CounselFieldDefDto } from './dto/field/counsel-field.dto';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { SafeUser } from '../auth/types/safe-user.type';

interface AuthenticatedRequest extends Request {
  user: SafeUser;
}

@ApiTags('Counsel Fields')
@ApiBearerAuth('JWT')
@Controller('counsel-fields')
export class CounselFieldsController {
  constructor(private readonly counselFieldService: CounselFieldService) {}

  @Get()
  @RequireAuth('counsels', 'read')
  @ApiOperation({
    summary: '상담 동적 필드 정의 조회',
    description: `테넌트에 설정된 활성 상태의 동적 필드 목록을 조회합니다.

**권한:** counsels.read

**정렬:** sortOrder ASC (null 후순위) → fieldId ASC
**필터:** isActive = 1인 필드만 반환`,
  })
  @ApiOkResponse({ description: '필드 정의 조회 성공', type: [CounselFieldDefDto] })
  async findActiveFields(
    @Req() request: AuthenticatedRequest,
  ): Promise<CounselFieldDefDto[]> {
    return this.counselFieldService.findActiveCounselFields(request.user.tenantId);
  }
}
