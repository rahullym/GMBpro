# Google Business Profile API Integration Setup

This guide will help you set up the Google Business Profile API integration for the GMB Optimizer application.

## Prerequisites

- Google Cloud Console account
- Google Business Profile account with verified business locations
- Node.js 18+ and npm installed
- PostgreSQL and Redis running

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `gmb-optimizer`
4. Click "Create"

### 1.2 Enable Required APIs

Enable the following APIs in your Google Cloud project:

1. **Google Business Profile API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Business Profile API"
   - Click "Enable"

2. **Google Business Profile Account Management API**
   - Search for "Google Business Profile Account Management API"
   - Click "Enable"

3. **Google Business Profile Business Information API**
   - Search for "Google Business Profile Business Information API"
   - Click "Enable"

4. **Google Business Profile Reviews API**
   - Search for "Google Business Profile Reviews API"
   - Click "Enable"

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required fields:
   - App name: `GMB Optimizer`
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/business.manage`
   - `https://www.googleapis.com/auth/plus.business.manage`
   - `https://www.googleapis.com/auth/plus.me`
5. Add test users (your Google account)
6. Save and continue

### 1.4 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set name: `GMB Optimizer Web Client`
5. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
6. Click "Create"
7. Copy the Client ID and Client Secret

## Step 2: Environment Configuration

### 2.1 Backend Environment Variables

Add the following to your `apps/backend/.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Encryption key for OAuth tokens (generate a secure random string)
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Other existing variables...
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gmb_optimizer
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
OPENAI_API_KEY=your-openai-api-key
FRONTEND_URL=http://localhost:3000
```

### 2.2 Generate Encryption Key

Generate a secure 32-character encryption key:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

## Step 3: Install Dependencies

The required dependencies are already included in the project:

```json
{
  "googleapis": "^128.0.0",
  "passport-google-oauth20": "^2.0.0"
}
```

## Step 4: API Integration Features

### 4.1 Implemented Features

✅ **OAuth 2.0 Authentication**
- Complete authorization flow with PKCE
- Encrypted refresh token storage
- Automatic token refresh

✅ **Business Account Management**
- List user's Google Business Profile accounts
- Account validation and permissions

✅ **Location Management**
- Fetch business locations from Google Business Profile
- Location details and information sync
- OAuth token management per location

✅ **Review Management**
- Fetch reviews from Google Business Profile
- Real-time review polling via background jobs
- Review metadata and sentiment analysis

✅ **Reply Publishing**
- Post replies to Google Business Profile reviews
- Background job processing for reliable delivery
- Error handling and retry logic

### 4.2 API Endpoints Used

- `GET /accounts` - List business accounts
- `GET /accounts/{account}/locations` - List account locations
- `GET /accounts/{account}/locations/{location}/reviews` - List location reviews
- `PUT /accounts/{account}/locations/{location}/reviews/{review}/reply` - Post review reply

## Step 5: Testing the Integration

### 5.1 Start the Application

```bash
# Start all services
docker-compose up -d

# Start development servers
npm run dev
```

### 5.2 Test OAuth Flow

1. Navigate to `http://localhost:3000/login`
2. Click "Continue with Google"
3. Complete OAuth consent flow
4. Verify business accounts and locations are imported

### 5.3 Test Review Syncing

1. Go to dashboard
2. Click "Sync" on a location
3. Check that reviews are fetched and stored
4. Verify sentiment analysis is working

### 5.4 Test Reply Publishing

1. Go to a review detail page
2. Generate an AI reply
3. Publish the reply
4. Verify it appears on Google Business Profile

## Step 6: Production Deployment

### 6.1 Update OAuth Settings

1. In Google Cloud Console, update OAuth consent screen:
   - Change to "Production" mode
   - Add your production domain
   - Complete verification process if required

2. Update redirect URIs:
   - Add production callback URL
   - Remove development URLs if needed

### 6.2 Environment Variables

Update production environment variables:

```env
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

### 6.3 Security Considerations

- Use strong encryption keys
- Enable HTTPS in production
- Implement rate limiting
- Monitor API usage and quotas
- Set up proper logging and monitoring

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure redirect URI matches exactly in Google Cloud Console
   - Check for trailing slashes or protocol mismatches

2. **"Access blocked"**
   - Verify OAuth consent screen is configured
   - Add your email as a test user
   - Check if app is in production mode

3. **"API not enabled"**
   - Ensure all required APIs are enabled in Google Cloud Console
   - Check API quotas and billing

4. **"Invalid refresh token"**
   - Re-authenticate the user
   - Check if token has expired or been revoked

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
DEBUG=googleapis:*
```

## API Quotas and Limits

- **Reviews API**: 10,000 requests per day
- **Business Information API**: 10,000 requests per day
- **Account Management API**: 1,000 requests per day

Monitor usage in Google Cloud Console → APIs & Services → Quotas.

## Support

For issues with the Google Business Profile API:
- [Google Business Profile API Documentation](https://developers.google.com/my-business)
- [Google Cloud Support](https://cloud.google.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-my-business-api)

For issues with this integration:
- Check the application logs
- Verify environment variables
- Test with mock data first

