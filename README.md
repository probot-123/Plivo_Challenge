# Status Page Application

A modern, real-time status page application designed to help organizations monitor and communicate the status of their services to users. Built with Next.js, TypeScript, and PostgreSQL, this application leverages clean architecture principles and modern web development practices.

![alt text](image.png)

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [Project Architecture](#project-architecture)
- [Code Quality & Development Approach](#code-quality--development-approach)
- [Frontend Implementation](#frontend-implementation)
- [Backend Implementation](#backend-implementation)
- [Problem-Solving Approach](#problem-solving-approach)
- [AI-First Development](#ai-first-development)
- [API Documentation](#api-documentation)


## ✨ Features

- **Organization Management**: Multi-tenant support for different organizations
- **Service Status Tracking**: Monitor and update status of various services
- **Incident Reporting**: Create, track, and resolve incidents with real-time updates
- **Maintenance Scheduling**: Plan and communicate scheduled maintenance
- **Real-time Updates**: WebSocket integration for instant status changes
- **Public Status Pages**: Customizable public pages for each organization
- **Team Collaboration**: Multiple team members can manage services
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Real-time Communication**: Socket.IO


## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account (for authentication)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/probot-123/Plivo_Challenge.git
```

2. Install dependencies:

```bash
npm install
```

### Configuration

1. Create a `.env.local` file based on the `.env.example`:

```bash
cp .env.example .env.local
```

2. Update the following environment variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
```

### Running the Application

1. Generate and run database migrations:

```bash
npm run db:generate
npm run db:migrate
```

2. Start the development server:

```bash
npm run dev
```

3. Access the application at `http://localhost:3000`

## 🏗️ Project Architecture

The project follows a **clean architecture** pattern with clear separation of concerns:

```
src/
├── domain/             # Business entities and repository interfaces
│   ├── entities/       # Core business models
│   └── repositories/   # Repository interfaces
├── infrastructure/     # Implementation of domain interfaces
│   ├── db/             # Database schema and connection
│   └── repositories/   # Repository implementations
├── app/                # Next.js App Router pages and API routes
│   ├── api/            # API endpoints
│   ├── dashboard/      # Admin dashboard pages
│   └── [slug]/         # Public status pages
└── lib/                # Shared utilities and helpers
```

### Key Architectural Principles:

- **Domain-Driven Design**: Business logic is encapsulated in the domain layer
- **Repository Pattern**: Data access is abstracted through repository interfaces
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Single Responsibility**: Each component has a well-defined responsibility

## 💻 Code Quality & Development Approach

Our codebase emphasizes:

- **Clean, Self-Documenting Code**: Descriptive variable and function names
- **Consistent Code Style**: Enforced through TypeScript and ESLint
- **Modularity**: Code organized into reusable, focused components
- **Type Safety**: Comprehensive TypeScript types across the application
- **Error Handling**: Robust error handling patterns at all levels

Example of our coding standards:

```typescript
/**
 * Repository interface for maintenance management
 * Defines operations for creating, retrieving, and updating maintenance records
 */
interface MaintenanceRepository {
  create(data: MaintenanceCreateInput): Promise<Maintenance>;
  findById(id: string): Promise<Maintenance | null>;
  findByOrganizationId(
    organizationId: string,
    filter?: MaintenanceFilter
  ): Promise<Maintenance[]>;
  update(
    id: string,
    data: Partial<MaintenanceUpdateInput>
  ): Promise<Maintenance>;
  updateStatus(id: string, status: MaintenanceStatus): Promise<Maintenance>;
  delete(id: string): Promise<void>;
}
```

## 🎨 Frontend Implementation

Our frontend implementation showcases:

- **Responsive Design**: Adapts to different screen sizes using Tailwind CSS
- **Component Structure**: Follows atomic design principles with reusable components
- **State Management**: Uses React hooks and context for predictable state flows
- **Real-time Updates**: WebSocket integration for instant status changes
- **Error Handling**: Graceful error states and loading indicators
- **Accessibility**: ARIA attributes and keyboard navigation support

The application features a clean, minimalistic UI inspired by modern design systems, prioritizing usability and information hierarchy.

## 🔧 Backend Implementation

The backend architecture demonstrates:

- **RESTful API Design**: Consistent endpoints following REST principles
- **Database Integration**: Efficient data access using Drizzle ORM
- **Authentication**: Secure user authentication via Clerk
- **Validation**: Request validation using schema validation
- **Error Handling**: Structured error responses and logging
- **Real-time Communication**: WebSocket server for instant updates

API endpoints are organized by resource type and follow predictable patterns:

```
/api/organizations/[organizationId]/services
/api/organizations/[organizationId]/incidents
/api/organizations/[organizationId]/maintenances
/api/public/organizations/[slug]/services
```

## 🧩 Problem-Solving Approach

Our development process emphasizes:

- **Iterative Development**: Breaking complex problems into manageable pieces
- **Performance Optimization**: Identifying and addressing bottlenecks
- **Security Considerations**: Implementing best practices for data protection
- **User-Centered Design**: Focusing on real user needs and workflows

An example of our problem-solving approach is our implementation of real-time status updates using WebSockets, which required careful consideration of:

- Connection management
- Event broadcasting
- State synchronization
- Error recovery
- Scalability

## 🤖 AI-First Development

This project demonstrates an AI-first development approach:

- **Prompt Engineering**: Using specific, well-structured prompts with AI tools
- **Cursor Rules**: Using cursor rules to enforce code standards
- **Code Generation**: Leveraging AI to generate boilerplate and repetitive code
- **Code Review**: Using AI to identify potential issues and improvements
- **Documentation**: Generating initial documentation with AI assistance
- **Problem Solving**: Collaborating with AI to explore solution approaches

By incorporating AI tools into the development workflow, we've significantly accelerated development while maintaining high code quality and consistency.

## 📚 API Documentation

The application includes comprehensive API documentation:

- **Swagger/OpenAPI**: Available at `/api-docs`
- **Endpoint Documentation**: Each endpoint includes detailed parameter and response documentation
- **Authentication Requirements**: Clear documentation of auth requirements for each endpoint


This application could not not be deployed due to build issues.You can test on localhost.
Loom video link->https://www.loom.com/share/e35464ab963d4b989dde271d5be996d4?sid=49957114-b97b-495f-a163-a5a6838c4318

