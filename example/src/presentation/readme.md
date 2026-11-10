# `src/presentation` — HTTP layer

Controllers, request classes, Swagger response models and the feature modules.
Thin by design: validate, call one service, wrap the result.

```
api/v1/
  auth/     AuthController, LoginRequest/LoginResponse, AuthModule
  user/     UserController, request/*, response/*, UserModule
  product/  ProductController (+ adjust-stock), request/*, response/*, ProductModule
  health/   HealthController, HealthModule
presentation.module.ts
```

## Feature module

```ts
@Module({
  controllers: [UserController],
  providers: [{ provide: UserServiceSymbol, useClass: UserService }],
  exports: [UserServiceSymbol]
})
export class UserModule {}
```

Nothing else. `CommonModule` and `DataModule` are global, so there is no
`RequestContextService` re-registration here — the old template did that and
ended up with several instances of the same request context.

## Controller

```ts
@ApiTags('user')
@Controller({ path: 'user', version: '1' })
export class UserController extends BaseDataController<
  UserDto, number,
  UserSearchRequest, UserCreateRequest, UserUpdateRequest, UserDeleteRequest,
  IUserService
>(UserDto, UserSearchRequest, UserCreateRequest, UserUpdateRequest, UserDeleteRequest) { … }
```

Endpoints inherited from the factory:

| Method | Path | Status |
| --- | --- | --- |
| `POST` | `/search` | 200 |
| `POST` | `/` | 201 |
| `GET` | `/:id` | 200 |
| `PUT` | `/:id` | 200 |
| `DELETE` | `/:id` | 200 |

A feature specific endpoint is a normal method, e.g. `adjust-stock`, and must
declare `@HttpCode`, `@ApiOperation`, `@ApiBody` and the error responses.

## Rules

- **Never import `@data/*`.** Controllers talk to a service interface; ESLint
  fails the build otherwise.
- No logic beyond mapping and wrapping — `ObjectHelper.map(request, Dto,
  { onlyExposed: false })` then `OKResponse(...)`.
- `@HttpCode` on every route; never rely on the framework default.
- Request classes extend a `Base*Request` and carry `@IsNotEmpty()` on required
  fields plus the Swagger `@ApiProperty` documentation.
- `/health` is `@Public()`, version neutral and excluded from the global prefix.
- `/health` also carries `@SkipThrottle()`: a probe is polled every few seconds
  and must never be able to return `429`.
- Status codes and the envelope come from `src/common`; a controller never
  builds a response body by hand.