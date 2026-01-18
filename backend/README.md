<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Project additions for flowdesk-admin (Auth, Swagger, Health)

The backend has been extended with practical features for this project. Below is a summary of the additions and how to use them.

Features added
- JWT 인증 (로그인) 및 보호된 라우트
- 사용자 등록(회원가입)
 - 리프레시 토큰 (요약)

  리프레시 토큰은 액세스 토큰 만료 시 새 액세스 토큰을 받기 위해 사용하는 별도의 자격증명입니다. 발급된 리프레시 토큰은 `tokenId.secret` 형식이며, 서버는 원시 secret을 저장하지 않고 `tokenId`와 bcrypt 해시(`token_hash`)만 보관합니다.

  <details>
  <summary>상세 설명</summary>

  리프레시 토큰은 액세스 토큰 만료 시 새로운 액세스 토큰을 발급받기 위해 사용되는 별도의 자격증명입니다. 이 프로젝트에서는 리프레시 토큰을 `tokenId.secret` 형태로 발급하고, 서버는 `tokenId`와 `secret`의 bcrypt 해시(`token_hash`)만 저장합니다. 클라이언트가 리프레시 요청을 보내면 서버는 제출된 `secret`을 저장된 해시와 비교하여 검증합니다.

  보안 동작 요약:
  - 리프레시 토큰은 사용 시 회전(rotation)됩니다. 즉, 리프레시가 성공하면 서버는 기존 토큰을 폐기하고 새 토큰을 발급합니다. 이 과정은 동일 토큰의 재사용을 어렵게 만듭니다.
  - 특정 리프레시 토큰만 폐기할 수 있고(로그아웃), 사용자의 모든 리프레시 토큰을 한 번에 폐기할 수도 있습니다(로그아웃-전체).
  - 전체 폐기 시 `users.token_version` 값을 증가시키는데, 액세스 토큰은 발급 시 `tokenVersion`을 포함하므로 값이 변경된 이후에는 이전 액세스 토큰이 더 이상 유효하지 않습니다.

  </details>
- Swagger API 문서 (비프로덕션 환경에서 `/api`에 제공)
- 헬스 체크 엔드포인트 (/health)

Endpoints
 - POST /auth/register  — 회원가입 (Register)
  - Body: { tenantName, userId, password, corpName, userName, userEmail?, userTel?, userHp? }
  - Response: created user (without password)

 - POST /auth/login — 로그인
  - Body: { tenantName, userId, password }
  - Response: { accessToken, expiresIn, user, refreshToken, refreshExpiresAt }
  - Note: the returned refreshToken has the raw format `tokenId.secret`. The server stores `tokenId` and a bcrypt hash of the `secret` only — the raw secret is never stored. Use POST /auth/refresh to exchange the refresh token for a new access token. On successful refresh the server rotates the refresh token (returns a new refreshToken) and revokes the previous one atomically.

- GET /auth/me — 토큰 기반 사용자 정보 (Authorization: Bearer <token>)

- GET /health — 헬스 체크, DB 연결 상태 포함

- POST /auth/refresh — 리프레시 토큰으로 액세스 토큰 갱신
  - Body: { refreshToken: "<tokenId.secret>" }
  - Response: { accessToken, expiresIn, user, refreshToken, refreshExpiresAt }
  - Security notes: the server verifies the secret part using bcrypt.compare against the stored hash. If another concurrent request uses the same refresh token, the server revokes the old token with a conditional (WHERE revoked = 0) update to prevent reuse.

- POST /auth/logout — 로그아웃 (단일 리프레시 토큰 폐기)
  - Body: { refreshToken: "<tokenId.secret>" }
  - Behavior: verifies the secret, ensures the requester owns the token, then revokes that refresh token.

- POST /auth/logout-all — 모든 장치에서 로그아웃 (현재 사용자에 대한 모든 리프레시 토큰 폐기)
  - Requires: Authorization: Bearer <ACCESS_TOKEN>
  - Behavior: revokes all refresh tokens for the current user and increments `users.token_version`. Access tokens carry `tokenVersion` in their payload; incrementing `token_version` immediately invalidates previously issued access tokens.

Swagger
- Available at: http://localhost:3000/api (disabled when NODE_ENV=production)
- Includes JWT bearer auth in the UI (you can paste the token to authorize)

Environment variables to add (backend/.env or .env.development)
- JWT_SECRET=your_jwt_secret_here
- JWT_EXPIRES_IN=3600s
- REFRESH_EXPIRES_DAYS=7    # (optional) refresh token lifetime in days, default 7

데이터베이스 마이그레이션 안내

- 이 변경은 `users` 테이블에 `token_version` 컬럼을 추가하고 `refresh_tokens` 테이블을 생성하는 마이그레이션이 필요합니다. 예시 마이그레이션 작업:
  1) `users.token_version INT NOT NULL DEFAULT 0` 컬럼 추가
  2) `refresh_tokens` 테이블 생성 (예시 컬럼):
    - `token_id` VARCHAR(36) PRIMARY KEY
    - `token_hash` VARCHAR(200) NOT NULL  -- bcrypt 해시
    - `user_seq` INT NOT NULL              -- `users.user_seq` FK
    - `expires_at` DATETIME NOT NULL
    - `revoked` TINYINT(1) NOT NULL DEFAULT 0
    - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

  참고: 리프레시 토큰 설계상 서버에는 원시 `secret`을 저장하지 않고 `token_hash`에 bcrypt로 해시된 값만 저장합니다.

Required packages (install in backend folder)
- passport @nestjs/passport passport-jwt
- @nestjs/jwt
- bcrypt
  example:
  ```bash
  cd backend
  npm install passport @nestjs/passport passport-jwt @nestjs/jwt bcrypt --save
  npm install -D @types/passport @types/passport-jwt
  ```

Quick test examples (curl)
- Register (success):
  ```bash
  curl -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d '{"tenantName":"tenant-a","userId":"alice","password":"password123","corpName":"ACME","userName":"Alice"}'
  ```

- Register (duplicate user -> 409):
  ```bash
  curl -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d '{"tenantName":"tenant-a","userId":"alice","password":"password123","corpName":"ACME","userName":"Alice"}'
  ```

- Login:
  ```bash
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"tenantName":"tenant-a","userId":"alice","password":"password123"}'
  ```

- Protected call (use returned token):
  ```bash
  curl http://localhost:3000/auth/me -H "Authorization: Bearer <ACCESS_TOKEN>"
  ```

- Refresh token exchange:
  ```bash
  curl -X POST http://localhost:3000/auth/refresh \
    -H "Content-Type: application/json" \
    -d '{"refreshToken":"<REFRESH_TOKEN>"}'
  ```

- Logout / revoke refresh token:
  ```bash
  curl -X POST http://localhost:3000/auth/logout \
    -H "Content-Type: application/json" \
    -d '{"refreshToken":"<REFRESH_TOKEN>"}'
  ```

- Logout from all devices (revoke all refresh tokens for current user):
  ```bash
  # requires an Authorization: Bearer <ACCESS_TOKEN> header
  curl -X POST http://localhost:3000/auth/logout-all \
    -H "Authorization: Bearer <ACCESS_TOKEN>"
  ```

Notes and gotchas
- Ensure your MySQL database is running and the `tenants` and `users` tables exist.
- The project expects `users.user_pwd` to store a bcrypt hash. Registration hashes the password automatically.
- Swagger is disabled in production by default.

If you want, I can also add a short `backend/USAGE.md` with these commands and examples.
