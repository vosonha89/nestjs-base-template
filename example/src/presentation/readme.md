# `src/presentation` — HTTP layer

Controllers, request classes, Swagger response models and the feature modules.
Thin by design: validate, call one service, wrap the result.

```
api/v1/
  <feature>/   <Name>Controller, request/*, response/*, <Name>Module
  health/      HealthController, HealthModule
feature.registry.ts   FEATURE_MODULES, SWAGGER_TAGS
presentation.module.ts
```

No feature ships with the template. `example/src/presentation/api/v1/` shows
`auth`, `user` and `product`, including a non-CRUD endpoint (`adjust-stock`).

## Feature module

```ts
@Module({
  controllers: [<Name>Controller],
  providers: [{ provide: <Name>ServiceSymbol, useClass: <Name>Service }],
  exports: [<Name>ServiceSymbol]
})
export class <Name>Module {}
```

Nothing else. `CommonModule` and `DataModule` are global, so there is no
`RequestContextService` re-registration here — the old template did that and
ended up with several instances of the same request context.

The module is mounted by appending one entry to
`src/presentation/feature.registry.ts`; `presentation.module.ts` imports that
array and never lists modules itself.

## Controller

```ts
@ApiTags('<feature>')
@Controller({ path: '<feature>', version: '1' })
export class <Name>Controller extends BaseDataController<
  <Name>Dto, number,
  <Name>SearchRequest, <Name>CreateRequest, <Name>UpdateRequest, <Name>DeleteRequest,
  I<Name>Service
>(<Name>Dto, <Name>SearchRequest, <Name>CreateRequest, <Name>UpdateRequest, <Name>DeleteRequest) { … }
```

Endpoints inherited from the factory:

| Method | Path | Status |
| --- | --- | --- |
| `POST` | `/search` | 200 |
| `POST` | `/` | 201 |
| `GET` | `/:id` | 200 |
| `PUT` | `/:id` | 200 |
| `DELETE` | `/:id` | 200 |

A feature specific endpoint is a normal method on the controller — declare
`@HttpCode`, `@ApiOperation`, `@ApiBody` and the error responses, and let the
service own the rule. There is a worked example in
`example/src/presentation/api/v1/product/` (`POST /:id/adjust-stock`).

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