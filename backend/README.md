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
- JWT authentication (login) and protected route
- User registration (signup)
- Swagger API docs (available at /api in non-production)
- Health check endpoint (/health)

Endpoints
 - POST /auth/register  — 회원가입 (Register)
  - Body: { tenantName, userId, password, corpName, userName, userEmail?, userTel?, userHp? }
  - Response: created user (without password)

 - POST /auth/login — 로그인
  - Body: { tenantName, userId, password }
  - Response: { accessToken, expiresIn, user }
  - Also returns a refreshToken and refreshExpiresAt. Use POST /auth/refresh to exchange refresh token for a new access token.

- GET /auth/me — 토큰 기반 사용자 정보 (Authorization: Bearer <token>)

- GET /health — 헬스 체크, DB 연결 상태 포함

Swagger
- Available at: http://localhost:3000/api (disabled when NODE_ENV=production)
- Includes JWT bearer auth in the UI (you can paste the token to authorize)

Environment variables to add (backend/.env or .env.development)
- JWT_SECRET=your_jwt_secret_here
- JWT_EXPIRES_IN=3600s

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
