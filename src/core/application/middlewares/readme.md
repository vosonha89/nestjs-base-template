Core / Application / Middlewares
================================

Purpose
- This directory hosts application-layer middlewares: reusable, framework-agnostic cross-cutting behaviors that run before/around use case execution (e.g., request context building, correlation, tenant resolution, idempotency, audit enrichment).
- Implementations here must not import web-server types. Keep them independent of specific transports (HTTP, gRPC, messaging).

What belongs here
- Policies that should consistently run across features before invoking application services/use cases.
- Logic that is easy to test without booting the web framework.
- Concerns that are orthogonal to business logic but influence it (context propagation, auth hints, feature flags, metrics).

What does NOT belong here
- Raw server/runtime middleware (e.g., helmet, compression) — register at bootstrap.
- Feature-only, route-scoped transforms — place near the feature in the presentation layer.
- Persistence/network plumbing — goes to infrastructure.

Recommended structure
- contracts/ — pure TS interfaces for context, middleware, composition.
- implementations/ — reusable middleware units (e.g., correlation, tenant, idempotency).
- policies/ — composed chains that bundle several middlewares for a given policy.
- README.md — this document.

Minimal contracts (example)
