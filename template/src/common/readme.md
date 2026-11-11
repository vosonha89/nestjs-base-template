# `src/common` — cross-cutting foundation

Everything that is not specific to one feature: base classes, guards, pipes,
interceptors, the exception filter, logging and helpers.

| Folder | Contents |
| --- | --- |
| `base/` | `BaseDataService`, `BaseDataController`, `BaseResponse`, `BaseRequest`, `BaseEntity`, `BaseRepository`, `BaseType`, `BaseService`, `BaseController` |
| `constant/` | `ConstantValue`, `FilterCondition` |
| `decorator/` | `@Public()`, `@Roles()`, `@CurrentUser()` |
| `exception/` | `GlobalError`, `AppError`, `ClientError`, `ErrorResponse` + factories, `AllExceptionFilter` |
| `guard/` | `JwtAuthGuard`, `RolesGuard`, `JwtStrategy` (the global `ThrottlerGuard` lives in `CommonModule`) |
| `helper/` | `ObjectHelper` (mapping) |
| `interceptor/` | `ResponseTransformInterceptor`, `LoggingInterceptor` |
| `middleware/` | `CorrelationIdMiddleware` |
| `pipe/` | `AppValidationPipe`, `ParseEntityIdPipe` |
| `service/` | `LoggingService`, `RequestContextService`, `BcryptHashService` (+ interfaces + Symbols) |
| `type/` | `UserInfo`, `RequestWithUser` |
| `common.module.ts` | `@Global()` — registers every `APP_*` provider exactly once |

## The envelope

`BaseResponseData<T>` is the only response shape:

```
serverDateTime │ status │ msg │ successful │ data? │ exception?
```

`ErrorResponse` extends it and never carries `data`; `BaseResponse<T>` never
carries `exception`. Factories keep controllers free of literal numbers.

## Error catalogue

`GlobalError` maps both HTTP statuses (`401`, `404`, `409`…) and fine grained
validation codes (`4001`–`4008`). `AppValidationPipe` translates a
`class-validator` constraint key into the right code, so the numeric contract
survives even though validation is delegated to the framework.

## Rules

- This folder must **not** import `@data`, `@services` or `@presentation`.
- A base class must earn its place: if it has one subclass, delete it.
- `CommonModule` is the only place a global provider is registered. A feature
  module declaring `APP_GUARD` again is a bug (the old code did that and ended
  up with two interceptors). The guard chain is `JwtAuthGuard` → `RolesGuard` →
  `ThrottlerGuard`, in that order (see `ARCHITECTURE.md` for why throttling is
  last).
- Anything that reaches `process.env` belongs in `src/config`, not here.
- Every service is a singleton; request data comes from
  `IRequestContextService` (`AsyncLocalStorage`), never `Scope.REQUEST`.