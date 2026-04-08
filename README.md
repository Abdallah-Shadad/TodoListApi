# TodoList API

A RESTful API built with ASP.NET Core, Entity Framework Core, and SQL Server. Supports user authentication with JWT and full task management per user.

## Tech Stack

- ASP.NET Core 9
- Entity Framework Core + SQL Server
- JWT Bearer Authentication
- BCrypt password hashing
- AutoMapper
- Swagger UI

## Getting Started

### Prerequisites

- .NET 9 SDK
- SQL Server (LocalDB works fine)
- Visual Studio 2022 or VS Code

### Setup

1. Clone the repository
```bash
git clone https://github.com/Abdallah-Shadad/TodoListApi.git
cd TodoListApi/Backend
```

2. Set up user secrets
```bash
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\MSSQLLocalDB;Database=TodoListApi;Trusted_Connection=True;TrustServerCertificate=True"
dotnet user-secrets set "Jwt:Key" "your-super-secret-key-minimum-32-characters"
dotnet user-secrets set "Jwt:Issuer" "TodoListApi"
dotnet user-secrets set "Jwt:Audience" "TodoListApiUsers"
```

3. Apply migrations
```bash
dotnet ef database update
```

4. Run the project
```bash
dotnet run
```

5. Open Swagger at `https://localhost:{PORT}/swagger`

## API Endpoints

### Auth

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/auth/register | Register a new user | No |
| POST | /api/auth/login | Login and receive JWT token | No |

### Tasks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/tasks | Get all tasks for current user | Yes |
| GET | /api/tasks/{id} | Get a specific task | Yes |
| POST | /api/tasks | Create a new task | Yes |
| PUT | /api/tasks/{id} | Update a task | Yes |
| PATCH | /api/tasks/{id} | Mark task as complete | Yes |
| DELETE | /api/tasks/{id} | Delete a task | Yes |

## Authentication

This API uses JWT Bearer tokens. After login or register, include the token in every request header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Project Structure

```
TodoListApi/
├── Controllers/
│   ├── BaseController.cs       # Shared GetUserId() helper
│   ├── AuthController.cs       # Register and Login
│   └── TasksController.cs      # Task CRUD operations
├── Data/
│   └── AppDbContext.cs         # EF Core DbContext
├── DTOs/
│   ├── RegisterDto.cs
│   ├── LoginDto.cs
│   ├── AuthResponseDto.cs
│   ├── CreateTaskDto.cs
│   ├── UpdateTaskDto.cs
│   └── TaskResponseDto.cs
├── Models/
│   ├── User.cs
│   └── TaskItem.cs
├── Services/
│   ├── IAuthService.cs
│   ├── AuthService.cs
│   ├── ITaskService.cs
│   └── TaskService.cs
├── MappingProfile.cs
└── Program.cs
└── Frontend/         // for test the api
    ├── index.html
    ├── styles.css
    └── app.js
```

## Security Notes

- Passwords are hashed using BCrypt — never stored in plain text
- JWT tokens expire after 7 days
- Each user can only access their own tasks (IDOR protection)
- Connection strings and secrets are stored in dotnet user-secrets locally and environment variables in production
- CORS is configured — restrict allowed origins before deploying to production

## Running the Frontend
The project includes a Vanilla JS Single Page Application (SPA).
To run it:
1. Navigate to the `Frontend` folder.
2. Open `index.html` in your web browser.
3. Ensure the backend is running (`dotnet run`) so the API requests succeed.
