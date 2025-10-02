# GMB Optimizer

AI-powered Google Business Profile review management SaaS platform built with NestJS and Next.js.

## 🚀 Features

### MVP Features Implemented

- **Authentication & User Management**
  - Email/password registration and login
  - JWT-based session management
  - Google OAuth integration for Google Business Profile connection
  - Multi-tenant business support

- **Location Management**
  - Connect/disconnect Google Business Profile locations
  - Store location information (name, address, coordinates, etc.)
  - Sync reviews from Google Business Profile API

- **Review Management**
  - Automatic polling of new reviews via background jobs
  - Review filtering and status management
  - Sentiment analysis for reviews
  - Bulk review approval functionality

- **AI Reply Generation**
  - 3 preset brand voices: Polite, Casual, Professional
  - OpenAI-powered reply generation
  - Draft management and editing
  - Manual publishing to Google Business Profile

- **Audit Logging**
  - Complete audit trail of all actions
  - User activity tracking
  - Business-level audit logs

## 🏗️ Tech Stack

- **Backend**: NestJS (TypeScript)
- **Frontend**: Next.js 14 + Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Background Jobs**: BullMQ with Redis
- **AI Integration**: OpenAI API
- **Authentication**: JWT + Google OAuth
- **Deployment**: Docker + Docker Compose

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Google Cloud Console project (for OAuth)
- OpenAI API key

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gmb-optimizer
```

### 2. Environment Setup

Create environment files:

```bash
# Backend environment
cp apps/backend/.env.example apps/backend/.env

# Update the following variables in apps/backend/.env:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gmb_optimizer"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OPENAI_API_KEY="your-openai-api-key"
FRONTEND_URL="http://localhost:3000"
```

### 3. Start with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, Backend, Worker)
docker-compose up -d

# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

### 4. Development Mode

```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs

## 📁 Project Structure

```
gmb-optimizer/
├── apps/
│   ├── backend/                 # NestJS API
│   │   ├── src/
│   │   │   ├── auth/           # Authentication module
│   │   │   ├── businesses/     # Business management
│   │   │   ├── locations/      # Location management
│   │   │   ├── reviews/        # Review management
│   │   │   ├── replies/        # AI reply generation
│   │   │   ├── audit-logs/     # Audit logging
│   │   │   ├── workers/        # Background job processors
│   │   │   ├── database/       # Prisma service
│   │   │   ├── config/         # Configuration files
│   │   │   └── common/         # Shared DTOs and utilities
│   │   ├── prisma/             # Database schema and migrations
│   │   └── Dockerfile
│   └── frontend/               # Next.js frontend
│       ├── src/
│       │   ├── app/           # App Router pages
│       │   ├── components/    # React components
│       │   ├── lib/          # API client and utilities
│       │   └── types/        # TypeScript types
│       └── package.json
├── docker-compose.yml          # Development environment
├── package.json               # Root package.json
└── README.md
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

- **Businesses**: Multi-tenant business accounts
- **Users**: Business users with roles (owner, admin, user)
- **Locations**: Google Business Profile locations
- **Reviews**: Customer reviews from Google
- **Replies**: AI-generated and manual replies
- **Audit Logs**: Complete activity tracking

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth flow
- `GET /api/auth/profile` - Get current user profile

### Businesses
- `GET /api/businesses/me` - Get current business
- `PUT /api/businesses/me` - Update business
- `GET /api/businesses/me/stats` - Business statistics

### Locations
- `GET /api/locations` - List all locations
- `POST /api/locations` - Create new location
- `GET /api/locations/:id` - Get location details
- `PATCH /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location
- `POST /api/locations/:id/sync` - Sync reviews

### Reviews
- `GET /api/reviews` - List reviews with filters
- `GET /api/reviews/:id` - Get review details
- `PATCH /api/reviews/:id` - Update review
- `PATCH /api/reviews/bulk/status` - Bulk update status

### Replies
- `GET /api/replies/reviews/:reviewId` - Get replies for review
- `POST /api/replies/reviews/:reviewId/generate` - Generate AI reply
- `PATCH /api/replies/:id` - Update reply
- `POST /api/replies/:id/publish` - Publish reply to Google

### Audit Logs
- `GET /api/audit` - Get audit logs
- `GET /api/audit/:id` - Get audit log details

## 🔄 Background Jobs

The application uses BullMQ for background job processing:

- **reviews.poll**: Polls Google Business Profile API for new reviews
- **reviews.process**: Processes and stores new reviews with sentiment analysis
- **replies.generate**: Generates AI replies using OpenAI
- **publish.attempt**: Publishes replies to Google Business Profile

## 🎨 Frontend Pages

- **Login/Register** (`/login`) - Authentication
- **Dashboard** (`/dashboard`) - Overview and statistics
- **Location Reviews** (`/locations/[id]/reviews`) - Review management
- **Review Detail** (`/reviews/[id]`) - Reply generation and publishing

## 🧪 Development Commands

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build

# Start production servers
npm start

# Database commands
npm run db:migrate      # Run migrations
npm run db:generate     # Generate Prisma client
npm run db:studio       # Open Prisma Studio

# Docker commands
npm run docker:up       # Start services
npm run docker:down     # Stop services
```

## 🔧 Configuration

### Google OAuth Setup

1. Create a Google Cloud Console project
2. Enable Google Business Profile API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

### OpenAI Setup

1. Get API key from OpenAI
2. Add to environment variables
3. Configure model and parameters in `openai.config.ts`

## 🚀 Deployment

### Production Environment

1. Update environment variables for production
2. Use production-ready JWT secrets
3. Configure proper CORS origins
4. Set up SSL certificates
5. Use managed PostgreSQL and Redis services

### Docker Production

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

- API documentation available at `/api/docs`
- Health checks implemented for all services
- Audit logs for complete activity tracking
- Error handling and logging throughout

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/api/docs`
- Review the audit logs for debugging
- Check the console logs for errors

---

**Note**: This is an MVP implementation. Production deployment should include additional security measures, monitoring, and scalability considerations.

