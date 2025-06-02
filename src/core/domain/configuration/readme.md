# Environment Configuration

This directory contains environment-based configuration definitions that shape the application's behavior across different environments.

## Purpose

The configuration directory provides:
- Environment variable definitions
- Configuration interfaces for different environments
- Validation schemas for environment variables
- Default configuration values

## Structure

```
configuration/
├── env/           # Environment configurations
│   ├── development/   # Development environment settings
│   ├── production/    # Production environment settings
│   └── test/         # Test environment settings
├── schemas/      # Environment validation schemas
└── interfaces/   # Configuration type definitions
```