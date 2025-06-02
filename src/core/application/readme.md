# Application Layer

This layer contains application logic and use cases. It orchestrates the flow of data to and from the domain entities, and coordinates the application's tasks.

## Purpose

The application layer:
- Implements use cases/business logic
- Orchestrates domain objects to accomplish tasks
- Remains independent of infrastructure concerns
- Acts as a facade between presentation and domain layers

## Structure

```
application/
├── dtos/           # Data Transfer Objects
├── ports/          # Ports (interfaces) for infrastructure adapters
├── services/       # Application services implementing use cases
└── mappers/        # Object mappers between layers
```

## Guidelines

1. Should not contain business rules or domain logic
2. Coordinates domain entities to execute business use cases
3. Transforms data between the domain and external layers
4. Depends on the domain layer but not on infrastructure