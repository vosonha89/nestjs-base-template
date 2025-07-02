# NestJS Base Template

[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/XezpwfPi1US9RhS159vdjh/Xkysgexu81sGiFtzJyFTrK/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/circleci/XezpwfPi1US9RhS159vdjh/Xkysgexu81sGiFtzJyFTrK/tree/main)

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A modern TypeScript NestJS application template using clean architecture principles.</p>

## Description

This project is a robust NestJS application template that follows clean architecture principles. It's built with TypeScript 5.7.3 and NestJS 11, providing a solid foundation for building scalable and maintainable server-side applications.

## Features

- **Clean Architecture** - Structured in core, presentation, and infrastructure layers
- **TypeScript 5.7.3** - Latest TypeScript features and type safety
- **NestJS 11** - Modern framework for building server-side applications
- **Comprehensive Testing** - Jest testing framework with example tests
- **Code Quality Tools** - ESLint 9.18.0 for code linting
- **CI/CD Integration** - CircleCI pipeline for continuous integration

## Project Setup

```bash
# Install dependencies
$ npm install
```

## Running the Application

```bash
# Development mode
$ npm run start

# Watch mode for development
$ npm run start:dev

# Debug mode
$ npm run start:debug

# Production mode
$ npm run start:prod
```

## Testing

```bash
# Run unit tests
$ npm run test

# Run tests in watch mode
$ npm run test:watch

# Generate test coverage report
$ npm run test:cov

# Debug tests
$ npm run test:debug
```

## Code Quality

```bash
# Lint and fix code
$ npm run lint

# Build with linting and testing
$ npm run build
```

## Project Structure

The application follows clean architecture principles with a clear separation of concerns:

```
src/
├── core/               # Core business logic and domain models
│   ├── application/    # Application services and use cases
│   └── domain/        # Domain entities and business rules
├── presentation/      # Controllers and API endpoints
├── infrastructure/    # External services, database, etc.
└── app.module.ts      # Main application module
```

## Architecture

This template follows the principles of clean architecture with three main layers:

1. **Core Layer** - Contains domain entities, business rules, and application services
2. **Presentation Layer** - Handles HTTP requests and responses through controllers
3. **Infrastructure Layer** - Implements external services, database access, etc.

This architecture promotes:
- Separation of concerns
- Testability
- Maintainability
- Independence from external frameworks

## Resources

- [NestJS Documentation](https://docs.nestjs.com) - Official NestJS documentation
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - Official TypeScript documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started) - Jest testing framework documentation
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) - Learn more about clean architecture principles

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

- [Vo Son Ha](https://github.com/vosonha)
- Project Repository - [GitHub](https://github.com/vosonha89/nestjs-base-template)

## License

This project is [MIT licensed](LICENSE).
