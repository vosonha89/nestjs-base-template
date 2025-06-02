# Application Services

This directory contains service implementations that orchestrate business operations and use cases in the application.

## Purpose

Application services:
- Execute use cases and business operations
- Coordinate between different domain objects
- Transform data between layers using DTOs
- Maintain transaction boundaries

## Structure

```
services/
├── auth/           # Authentication related services
├── users/          # User management services
├── common/         # Shared service functionality
└── integration/    # External service integrations
```

## Service Guidelines

1. **Service Responsibility**
   - One service class per use case or related use cases
   - Handle input validation and sanitization
   - Transform DTOs to domain objects and vice versa
   - Coordinate work between multiple repositories

2. **Method Naming**
   - Use verb-noun combinations (e.g., createUser, updateProfile)
   - Be specific about the operation
   - Reflect business terminology
   - Include return type in name when necessary

3. **Error Handling**
   - Throw specific application exceptions
   - Handle domain exceptions appropriately
   - Include meaningful error messages
   - Preserve stack traces