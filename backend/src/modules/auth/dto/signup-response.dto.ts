import { ApiProperty } from '@nestjs/swagger';

export class SignupResponseDto {
  @ApiProperty({ 
    description: '성공 메시지',
    example: '회원가입이 완료되었습니다.',
  })
  message: string;

  @ApiProperty({ 
    description: '생성된 테넌트 정보',
    example: {
      tenantId: 3,
      tenantName: 'acme_corp',
    },
  })
  tenant: {
    tenantId: number;
    tenantName: string;
  };

  @ApiProperty({ 
    description: '생성된 관리자 계정 정보',
    example: {
      userSeq: 1,
      userId: 'admin@acme.com',
      userName: 'John Doe',
    },
  })
  admin: {
    userSeq: number;
    userId: string;
    userName: string;
  };
}
