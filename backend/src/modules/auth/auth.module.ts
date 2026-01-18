import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../iam/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Permission } from '../iam/entities/permission.entity';
import { Role } from '../iam/entities/role.entity';
import { UserRole } from '../iam/entities/user-role.entity';
import { RolePermission } from '../iam/entities/role-permission.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
  TypeOrmModule.forFeature([
    User, 
    Tenant, 
    RefreshToken, 
    Permission, 
    Role,
    UserRole,
    RolePermission,
  ]),
  ConfigModule,
  PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const opts: any = {
          secret: configService.get<string>('JWT_SECRET') || 'changeme',
          signOptions: { expiresIn: String(configService.get<string | number>('JWT_EXPIRES_IN') || '3600s') },
        };
        return opts as any;
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
