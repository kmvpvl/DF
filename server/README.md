# DolceForte Server API

This is the GraphQL API server for the DolceForte application, built with Node.js, Express, TypeScript, Apollo Server, and Prisma.

## Getting Started

### Prerequisites

- Node.js 22+
- MySQL database
- Docker (for local database)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:
   Copy `.env` and update with your database credentials.

3. Generate Prisma client:

   ```bash
   npm run prisma:generate
   ```

4. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

### Running the Server

- Development: `npm run dev`
- Production: `npm run build && npm start`

Server runs on `http://localhost:5000`

## GraphQL API

### Endpoint

- GraphQL Playground: `http://localhost:5000/graphql`

### Current Schema

#### Queries

- `hello: String` - Returns a greeting message

#### Example Query

```graphql
query {
  hello
}
```

Response:

```json
{
  "data": {
    "hello": "Hello from GraphQL!"
  }
}
```

## Database

Uses Prisma ORM with MySQL.

- View database: `npm run prisma:studio`
- Schema file: `prisma/schema.prisma`

## Development

- Format code: `npm run format`
- Run tests: `npm test`
- Lint: `npm run lint`
- Release: `npm run release` (semantic versioning)

## Docker

To run with Docker Compose:

```bash
docker-compose up --build
```

Includes MySQL database service.

## Environment Variables

- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - MySQL connection string

## Contributing

1. Use conventional commits
2. Run tests before committing
3. Format code with Prettier
