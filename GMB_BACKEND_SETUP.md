# Google My Business Backend Integration Setup

This guide will help you connect your backend authentication with Google OAuth for Google My Business (GMB) integration.

## 🚀 Quick Setup

### 1. Google Cloud Console Configuration

#### Step 1: Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your project ID

#### Step 2: Enable Required APIs
Enable the following APIs in your Google Cloud project:

```bash
# Enable Google Business Profile API
gcloud services enable mybusinessbusinessinformation.googleapis.com

# Enable OAuth2 API
gcloud services enable oauth2.googleapis.com

# Enable Google+ API (for business management)
gcloud services enable plus.googleapis.com
```

Or enable them through the [Google Cloud Console](https://console.cloud.google.com/apis/library):
- Google Business Profile API
- Google+ API
- OAuth2 API

#### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: "GMB Optimizer"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/business.manage`
   - `https://www.googleapis.com/auth/plus.business.manage`
5. Add test users (for development)

#### Step 4: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - Development: `http://localhost:3001/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
5. Save and note down:
   - Client ID
   - Client Secret

### 2. Environment Configuration

Update your `.env` file with the following variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"

# Encryption Key (generate a secure 32-character hex string)
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Database (already configured)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gmb_optimizer"

# Redis (already configured)
REDIS_URL="redis://localhost:6379"

# JWT (already configured)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

### 3. Generate Encryption Key

Generate a secure encryption key for storing refresh tokens:

```bash
# Generate a 32-character hex encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `ENCRYPTION_KEY`.

### 4. Database Setup

The database schema is already configured. Run migrations if needed:

```bash
# Navigate to backend directory
cd apps/backend

# Run Prisma migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed the database (optional)
npm run prisma:seed
```

### 5. Install Dependencies

All required dependencies are already included in `package.json`:

```json
{
  "googleapis": "^128.0.0",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.2",
  "passport-google-oauth20": "^2.0.0",
  "bcryptjs": "^2.4.3"
}
```

## 🔧 API Endpoints

### Authentication Endpoints

#### Initiate Google OAuth
```http
GET /api/auth/google
```
Redirects user to Google OAuth consent screen.

#### OAuth Callback
```http
GET /api/auth/google/callback?code=AUTHORIZATION_CODE&state=STATE
```
Handles OAuth callback and creates/updates user with business profiles.

### Google Business Profile Endpoints

#### Get Business Accounts
```http
GET /api/locations/:id/gmb/accounts
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Get Account Locations
```http
GET /api/locations/:id/gmb/locations
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "accountName": "accounts/ACCOUNT_ID"
}
```

#### Get Location Reviews
```http
GET /api/locations/:id/gmb/reviews
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Post Review Reply
```http
POST /api/locations/:id/gmb/reviews/:reviewId/reply
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "replyText": "Thank you for your review!"
}
```

#### Get Location Details
```http
GET /api/locations/:id/gmb/details
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Update Location
```http
PUT /api/locations/:id/gmb/update
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Updated Business Name",
  "primaryPhone": "+1234567890",
  "websiteUri": "https://example.com"
}
```

#### Sync Location Data
```http
POST /api/locations/:id/gmb/sync
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Validate Token
```http
POST /api/locations/:id/gmb/validate-token
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🧪 Testing the Integration

### 1. Start the Application

```bash
# Start backend
cd apps/backend
npm run start:dev

# Start frontend (in another terminal)
cd apps/frontend
npm run dev
```

### 2. Test OAuth Flow

1. Go to `http://localhost:3000/login`
2. Click "Continue with Google"
3. Complete OAuth flow
4. Verify user creation and location import

### 3. Test API Endpoints

Use the Swagger documentation at `http://localhost:3001/api/docs` to test endpoints.

### 4. Test Background Jobs

Monitor background job processing:

```bash
# Check Redis for job queues
redis-cli
> KEYS *
> LLEN bull:google-business:waiting
```

## 🔒 Security Features

### 1. Token Encryption
- Refresh tokens are encrypted using AES-256-GCM
- Encryption key is environment-specific
- Tokens are never stored in plain text

### 2. Token Validation
- Automatic token refresh before API calls
- Token validation on each request
- Graceful handling of expired tokens

### 3. Audit Logging
- All GMB operations are logged
- User actions are tracked
- Security events are recorded

## 🚨 Troubleshooting

### Common Issues

#### 1. "Invalid redirect URI"
- Check Google Cloud Console OAuth settings
- Ensure redirect URI matches exactly
- Include both HTTP and HTTPS for development

#### 2. "Access denied" or "Insufficient permissions"
- Verify OAuth scopes in consent screen
- Check if user has granted all required permissions
- Ensure Google Business Profile API is enabled

#### 3. "No refresh token received"
- Add `prompt=consent` to OAuth URL
- Ensure `access_type=offline` is set
- User must complete full consent flow

#### 4. "Token expired" errors
- Check if refresh token is valid
- Verify encryption/decryption is working
- Re-authorize if refresh token is invalid

#### 5. "Business profile not found"
- User must have a Google Business Profile
- Profile must be verified
- User must have management permissions

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
LOG_LEVEL=debug
```

### API Rate Limits

Google Business Profile API has rate limits:
- 100 requests per 100 seconds per user
- Implement exponential backoff
- Use background jobs for bulk operations

## 📊 Monitoring

### 1. Application Logs
Monitor application logs for:
- OAuth flow completion
- API call success/failure
- Token refresh events
- Error rates

### 2. Database Monitoring
Track:
- User creation/updates
- Location imports
- Review syncing
- Token usage

### 3. Background Jobs
Monitor BullMQ queues:
- Job success/failure rates
- Processing times
- Queue lengths
- Error patterns

## 🔄 Production Deployment

### 1. Environment Variables
Update production environment:
```env
GOOGLE_REDIRECT_URI="https://yourdomain.com/api/auth/google/callback"
FRONTEND_URL="https://yourdomain.com"
NODE_ENV="production"
```

### 2. SSL Certificates
Ensure HTTPS is enabled for OAuth callbacks.

### 3. Database Security
- Use connection pooling
- Enable SSL for database connections
- Regular backups

### 4. Redis Security
- Enable authentication
- Use SSL connections
- Network isolation

## 📈 Performance Optimization

### 1. Caching
- Cache Google API responses
- Implement Redis caching
- Cache user business profiles

### 2. Background Processing
- Use queues for heavy operations
- Implement job prioritization
- Batch API calls when possible

### 3. Database Optimization
- Index frequently queried fields
- Use connection pooling
- Optimize Prisma queries

## 🎯 Next Steps

1. **Test the complete flow** with a real Google Business Profile
2. **Implement error handling** for edge cases
3. **Add monitoring** and alerting
4. **Optimize performance** based on usage patterns
5. **Add more GMB features** like insights and posts

## 📚 Additional Resources

- [Google Business Profile API Documentation](https://developers.google.com/my-business/content/basic-setup)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)

Your Google My Business backend integration is now ready! 🎉
