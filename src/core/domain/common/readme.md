# Domain Common Components

This directory contains common domain components, base classes, and utilities that are shared across the domain layer.

## Purpose

The common directory provides reusable domain components that:
- Define base structures for domain entities
- Implement shared domain logic
- Provide common value objects
- Define domain events and handlers

## Structure

```
common/
├── base/           # Base classes and interfaces
│   ├── entity/     # Base entity implementations
│   └── value/      # Base value object implementations
├── events/         # Domain event definitions
├── exceptions/     # Domain-specific exceptions
└── validators/     # Domain validation rules
```