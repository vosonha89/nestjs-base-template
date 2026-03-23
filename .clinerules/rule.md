# Cline Rules and Conventions

To ensure consistency and quality across the codebase, please adhere to the following rules:

## Code Style

- **Access Modifiers**: All class functions and properties MUST have explicit access modifiers (`public`, `private`, or `protected`).
- **Comments**: All functions and public properties MUST have a comment explaining their purpose. Keep comments simple and concise.
- **Unit Tests**: All application services and API controllers MUST have corresponding unit tests.

## Examples

### Correct
```typescript
/**
 * Validates user credentials
 * @param email User's email
 * @param pass User's password
 * @returns UserDto if valid, null otherwise
 */
public async validateUser(email: string, pass: string): Promise<UserDto | null> {
    // implementation
}

/**
 * The user service for handling user-related operations.
 */
public readonly userService: IUserService;
```

### Incorrect
```typescript
async validateUser(email: string, pass: string) {
    // implementation
}

userService: IUserService;
```
