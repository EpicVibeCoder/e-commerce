---
name: Production-Ready Monorepo Setup
overview: Set up a production-ready monorepo e-commerce platform with proper structure, Docker configuration, environment management, and development workflows following industry best practices.
todos:
  - id: clone-backend
    content: Clone mini-ecommerce-api repository into backend/ directory and verify structure
    status: pending
  - id: create-shared-package
    content: Initialize shared/ package with TypeScript, create type definitions for API contracts
    status: pending
  - id: init-nextjs
    content: Create Next.js application in frontend-web/ with TypeScript, Tailwind, App Router
    status: pending
    dependencies:
      - create-shared-package
  - id: init-react-native
    content: Create React Native/Expo application in frontend-mobile/ with TypeScript template
    status: pending
    dependencies:
      - create-shared-package
  - id: docker-compose-dev
    content: Create docker-compose.yml at root for development (MySQL, Redis services)
    status: pending
    dependencies:
      - clone-backend
  - id: docker-compose-prod
    content: Create docker-compose.prod.yml at root for production deployment
    status: pending
    dependencies:
      - clone-backend
  - id: backend-dockerfile
    content: Review and optimize backend Dockerfile for production (multi-stage build)
    status: pending
    dependencies:
      - clone-backend
  - id: nextjs-dockerfile
    content: Create production-optimized Dockerfile for Next.js with standalone output
    status: pending
    dependencies:
      - init-nextjs
  - id: env-configuration
    content: Set up environment variable files (.env.example, .env.development, .env.production) for all workspaces
    status: pending
  - id: root-scripts
    content: Enhance root package.json with production scripts, Docker management, and database scripts
    status: pending
  - id: git-config
    content: Create comprehensive .gitignore and configure Git for monorepo
    status: pending
  - id: api-clients
    content: Create API client utilities for Next.js and React Native with authentication handling
    status: pending
    dependencies:
      - init-nextjs
      - init-react-native
      - create-shared-package
  - id: cors-config
    content: Update backend CORS configuration to allow frontend origins
    status: pending
    dependencies:
      - clone-backend
  - id: documentation
    content: Create comprehensive README.md, CONTRIBUTING.md, and architecture documentation
    status: pending
  - id: validation
    content: "Test complete setup: services start, database connects, API works, frontends communicate"
    status: pending
    dependencies:
      - docker-compose-dev
      - api-clients
      - cors-config
---

# Production-Ready Monorepo

Setup Plan

## Architecture Overview

This plan establishes a monorepo structure optimized for production deployment while maintaining excellent developer experience. The setup follows industry best practices for scalability, maintainability, and team collaboration.

## Phase 1: Project Foundation & Structure

### 1.1 Clone and Integrate Backend API

- Clone `mini-ecommerce-api` repository into `backend/` directory
- Verify backend structure and dependencies
- Review existing Docker configuration in backend
- Document backend API endpoints and structure

### 1.2 Create Shared Package

- Initialize `shared/` package with TypeScript configuration
- Set up shared types/interfaces for API contracts
- Configure package exports for workspace consumption
- Establish type safety between frontend and backend

### 1.3 Initialize Frontend Applications

- Create Next.js application in `frontend-web/` with TypeScript, Tailwind, App Router
- Create React Native/Expo application in `frontend-mobile/` with TypeScript template
- Configure both to consume shared package
- Set up proper TypeScript path aliases

## Phase 2: Docker & Infrastructure Setup

### 2.1 Docker Compose Configuration (Root Level)

- Create `docker-compose.yml` for development environment
- Create `docker-compose.prod.yml` for production environment
- Configure MySQL and Redis services with health checks
- Set up proper networking and volume management
- Add service dependencies and startup ordering

### 2.2 Backend Dockerfile Optimization

- Review existing backend Dockerfile
- Create multi-stage build for production optimization
- Add development Dockerfile variant if needed
- Configure proper health checks and graceful shutdown

### 2.3 Next.js Dockerfile

- Create production-optimized Dockerfile for Next.js
- Configure standalone output mode
- Set up multi-stage build for minimal image size
- Add proper caching layers for faster builds

### 2.4 Environment Configuration

- Create `.env.example` files for each workspace
- Set up `.env.development` and `.env.production` templates
- Configure environment variable validation
- Document all required environment variables
- Add `.env` to `.gitignore` (keep examples)

## Phase 3: Development Tooling & Configuration

### 3.1 Root Package.json Enhancement

- Add production build scripts
- Add Docker management scripts (up, down, logs, restart)
- Add database management scripts (migrate, seed, studio, reset)
- Add linting and formatting scripts
- Add testing scripts across workspaces
- Configure workspace dependencies properly

### 3.2 Git Configuration

- Create comprehensive `.gitignore` for monorepo
- Set up `.gitattributes` for consistent line endings
- Configure Git hooks (pre-commit, pre-push) if needed
- Document Git workflow and branching strategy

### 3.3 Code Quality Tools

- Set up ESLint configuration (root and workspace-specific)
- Configure Prettier for consistent formatting
- Add TypeScript strict mode configurations
- Set up Husky for Git hooks (optional)
- Configure lint-staged for pre-commit checks

### 3.4 Documentation

- Create comprehensive `README.md` with setup instructions
- Document architecture and design decisions
- Create `CONTRIBUTING.md` for team guidelines
- Add API documentation references
- Document deployment procedures

## Phase 4: API Integration & Type Safety

### 4.1 Shared Types Package

- Define User, Product, Category, Order types
- Create API request/response types
- Set up authentication types
- Export all types from shared package index

### 4.2 Frontend API Clients

- Create Next.js API client with authentication handling
- Create React Native API client with secure token storage
- Implement proper error handling and retry logic
- Add request/response interceptors
- Configure base URLs from environment variables

### 4.3 CORS Configuration

- Update backend CORS to allow frontend origins
- Configure different origins for dev/staging/prod
- Set up proper credentials handling
- Document CORS requirements

## Phase 5: Development Workflow Setup

### 5.1 Development Scripts

- Configure hot reload for all services
- Set up concurrent development (backend + frontends)
- Add database seeding scripts
- Create helper scripts for common tasks

### 5.2 Database Management

- Set up Prisma migrations workflow
- Create database seed scripts
- Configure Prisma Studio access
- Document database schema and relationships

### 5.3 Local Development Environment

- Configure Docker services for local development
- Set up volume mounts for live code reloading
- Configure port mappings
- Set up local SSL certificates if needed (for production-like testing)

## Phase 6: Production Readiness

### 6.1 Build Optimization

- Configure production build scripts
- Set up build caching strategies
- Optimize Docker image sizes
- Configure build-time environment variables

### 6.2 Security Hardening

- Review and secure environment variable handling
- Configure proper secrets management
- Set up SSL/TLS for production
- Review and harden Docker security settings
- Configure proper authentication token handling

### 6.3 Monitoring & Logging

- Set up structured logging
- Configure health check endpoints
- Add application monitoring hooks
- Document logging strategy

### 6.4 CI/CD Preparation

- Create GitHub Actions workflow structure (or other CI/CD)
- Set up automated testing pipeline
- Configure automated Docker builds
- Set up deployment workflows
- Add environment-specific deployment configs

## Phase 7: Testing & Validation

### 7.1 Initial Setup Validation

- Verify all services start correctly
- Test database connections
- Verify Redis connectivity
- Test API endpoints
- Validate frontend-backend communication

### 7.2 Development Workflow Testing

- Test hot reload in all services
- Verify concurrent development works
- Test database migrations
- Validate environment variable loading

## File Structure (Final)

```javascript
e-commerce/
├── .env.development.example
├── .env.production.example
├── .gitignore
├── .gitattributes
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
├── README.md
├── CONTRIBUTING.md
├── backend/
│   ├── .env.example
│   ├── dockerfile
│   ├── dockerfile.dev (optional)
│   ├── src/
│   ├── prisma/
│   └── ...
├── frontend-web/
│   ├── .env.local.example
│   ├── Dockerfile
│   ├── Dockerfile.dev (optional)
│   ├── app/
│   ├── lib/
│   └── ...
├── frontend-mobile/
│   ├── .env.example
│   ├── src/
│   ├── app.json
│   └── ...
└── shared/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── types/
        └── index.ts
```



## Key Decisions Made

1. **Docker Location**: Root level for monorepo-wide management
2. **Development Strategy**: Infrastructure (MySQL/Redis) in Docker, applications run locally for best DX
3. **Production Strategy**: All services containerized with multi-stage builds
4. **Type Safety**: Shared package ensures type consistency across stack
5. **Environment Management**: Separate configs for dev/staging/prod
6. **Build Strategy**: Optimized production builds with proper caching

## Success Criteria

- All services can start with single command
- Hot reload works for all applications
- Type safety enforced across monorepo