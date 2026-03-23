# Cline Rules and Conventions

To ensure consistency and quality across the codebase, please adhere to the following rules:

## Code Style

### Access Modifiers
All class functions and properties MUST have explicit access modifiers (`public`, `private`, or `protected`).
- Use `private` as default for internal logic
- Use `public` only for exposed APIs (service methods, controller handlers)
- Use `protected` only when subclass access is required
- Use `private readonly` for injected dependencies and immutable properties

### Comments
All functions and public properties MUST have JSDoc comments explaining their purpose. Keep comments simple and concise.

### Unit Tests
All application services and API controllers MUST have corresponding unit tests.

## NestJS Architecture Rules

### Module Structure
- **Controllers**: Handle HTTP requests only, no business logic
- **Services**: Contain business logic, injected via dependency injection
- **Repositories**: Handle database access using TypeORM
- **DTOs**: Define data transfer objects for validation and typing

### TypeORM Guidelines
- Use Repository pattern consistently
- Avoid raw SQL queries unless absolutely necessary
- Use transactions for critical operations
- Define relations explicitly in entities
- Always specify return types for repository methods

### Type Safety
- No `any` type allowed
- Use strict TypeScript types
- Prefer interfaces and DTOs over generic types
- Explicit return types for all functions

## Code Quality Standards

### Clean Code Principles
- Use meaningful, descriptive names
- Keep functions small and focused (< 50 lines)
- Avoid code duplication (DRY principle)
- Prefer readability over cleverness

### SOLID Principles
- **Single Responsibility**: Each class/module should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for their base types
- **Interface Segregation**: Clients shouldn't depend on interfaces they don't use
- **Dependency Inversion**: Depend on abstractions, not concretions

## Testing Requirements

### Unit Testing Rules
- Test behavior, not implementation details
- Mock all external dependencies
- Keep tests isolated and independent
- Use descriptive test names
- Aim for high code coverage on critical paths

### Test Structure
```typescript
describe('ServiceName', () => {
  it('should describe expected behavior', async () => {
    // Arrange
    const mockDependency = { method: jest.fn().mockResolvedValue(expectedValue) };
    const service = new ServiceName(mockDependency as any);

    // Act
    const result = await service.methodUnderTest(input);

    // Assert
    expect(result).toEqual(expectedValue);
    expect(mockDependency.method).toHaveBeenCalledWith(input);
  });
});
```

## Examples

### Correct Implementation
```typescript
/**
 * Validates user credentials
 * @param email User's email
 * @param pass User's password
 * @returns UserDto if valid, null otherwise
 */
public async validateUser(email: string, pass: string): Promise<UserDto | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
        return null;
    }
    const isValid = await this.comparePasswords(pass, user.password);
    return isValid ? this.mapToDto(user) : null;
}

/**
 * The user service for handling user-related operations.
 */
private readonly userRepository: IUserRepository;
```

### Incorrect Implementation
```typescript
// Missing access modifier and documentation
async validateUser(email: string, pass: string) {
    // Missing return type
    const user = await this.userRepository.findByEmail(email);
    // Business logic in controller
    return user;
}

// Missing access modifier
userService: IUserService;
```

## ESLint Configuration
- No unused variables
- No `any` type
- Consistent return types
- Prefer `const` over `let`
- Enforce import order

## Documentation Requirements

### JSDoc Format
All public methods and properties must include JSDoc comments:
```typescript
/**
 * Brief description of the function
 * @param paramName Description of parameter
 * @returns Description of return value
 */
public async methodName(paramName: Type): Promise<ReturnType> {
    // implementation
}
```

### Property Documentation
```typescript
/**
 * The user service for handling user-related operations.
 */
public readonly userService: IUserService;
```

## Workflow Checklist

When implementing features, follow this order:
1. [ ] Analyze requirements and design structure
2. [ ] Create/update DTOs and interfaces
3. [ ] Implement entity classes with TypeORM
4. [ ] Create repository classes
5. [ ] Implement service classes with business logic
6. [ ] Create controller classes for HTTP endpoints
7. [ ] Write comprehensive unit tests
8. [ ] Verify ESLint compliance
9. [ ] Test integration and edge cases
