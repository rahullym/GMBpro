# Google OAuth Setup for Google Business Profile

This document explains how to set up and use the Google OAuth flow for Google Business Profile integration in the GMB Optimizer application.

## Overview

The implementation provides a complete OAuth 2.0 flow for Google Business Profile with the following features:

- **Secure OAuth Flow**: Complete authorization code flow with PKCE
- **Encrypted Token Storage**: Refresh tokens are encrypted using AES-256-GCM
- **Business Profile Integration**: Automatic discovery and connection of Google Business Profiles
- **Background Processing**: Queue-based processing for review syncing and reply posting
- **Token Management**: Automatic token refresh and validation

## Architecture

### Backend Components

1. **GoogleOAuthService** (`src/common/services/google-oauth.service.ts`)
   - Handles OAuth flow initiation and token exchange
   - Manages Google API interactions
   - Provides encryption/decryption for refresh tokens

2. **GoogleBusinessService** (`src/common/services/google-business.service.ts`)
   - Manages Google Business Profile API operations
   - Handles review fetching and reply posting
   - Location management and updates

3. **EncryptionUtil** (`src/common/utils/encryption.util.ts`)
   - AES-256-GCM encryption for sensitive data
   - Secure key management

4. **GoogleBusinessProcessor** (`src/workers/processors/google-business.processor.ts`)
   - Background job processing for Google Business operations
   - Review syncing and reply posting

### Frontend Components

1. **GoogleAuthButton** (`src/components/GoogleAuthButton.tsx`)
   - OAuth initiation button
   - Loading states and error handling

2. **Auth Callback Pages**
   - `/auth/callback` - Success handling
   - `/auth/error` - Error handling

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Business Profile API
   - Google+ API (for business management)
   - OAuth2 API

4. Create OAuth 2.0 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"

# Encryption (generate a 32-character hex string)
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

### 3. Generate Encryption Key

```bash
# Generate a secure encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Database Migration

The Prisma schema already includes the necessary fields for OAuth tokens:

```prisma
model Location {
  // ... other fields
  oauthRefreshToken    String?   // Encrypted Google OAuth refresh token
  lastSyncAt           DateTime?
  // ... other fields
}
```

Run migrations if needed:

```bash
npm run db:migrate
```

## Usage

### 1. OAuth Flow Initiation

Users can initiate the OAuth flow by clicking the "Connect Google Business Profile" button on the login page or dashboard.

### 2. OAuth Callback Handling

The backend automatically:
1. Exchanges authorization code for tokens
2. Fetches user information from Google
3. Discovers connected Google Business Profiles
4. Creates/updates location records with encrypted refresh tokens
5. Redirects to frontend with authentication data

### 3. Review Syncing

Reviews are synced automatically when:
- A location is first connected
- Manual sync is triggered from the dashboard
- Scheduled background jobs run

### 4. Reply Posting

Replies can be posted to Google Business Profile through:
- Manual posting from the dashboard
- Automated AI-generated replies
- Background job processing

## API Endpoints

### Authentication

- `GET /api/auth/google` - Initiate OAuth flow
- `GET /api/auth/google/callback` - Handle OAuth callback
- `POST /api/auth/google/callback` - Alternative callback endpoint

### Locations

- `GET /api/locations` - List all locations
- `POST /api/locations/:id/sync` - Sync location reviews
- `POST /api/locations/:id/connect` - Connect Google Business Profile
- `DELETE /api/locations/:id/disconnect` - Disconnect Google Business Profile

## Security Features

### 1. Token Encryption

Refresh tokens are encrypted using AES-256-GCM before storage:

```typescript
const encryptedToken = EncryptionUtil.encrypt(refreshToken, encryptionKey);
```

### 2. Token Validation

Tokens are validated before use:

```typescript
const isValid = await googleBusinessService.validateRefreshToken(encryptedToken);
```

### 3. Secure Storage

- Refresh tokens are never stored in plain text
- Encryption keys are environment-specific
- Tokens are automatically rotated when expired

## Error Handling

### Common Issues

1. **Invalid Refresh Token**
   - Automatically detected and location disconnected
   - User prompted to re-authorize

2. **API Rate Limits**
   - Implemented with exponential backoff
   - Queue-based processing prevents overload

3. **Network Issues**
   - Retry logic with circuit breaker pattern
   - Graceful degradation

### Error Responses

```json
{
  "statusCode": 400,
  "message": "Invalid refresh token - location disconnected",
  "error": "Bad Request"
}
```

## Monitoring and Logging

### Audit Logs

All OAuth operations are logged:

```typescript
await this.auditLogService.create({
  businessId,
  actorUserId: userId,
  action: 'connect',
  entityType: 'location',
  entityId: locationId,
  details: { connected: true },
});
```

### Background Jobs

Monitor job status through BullMQ dashboard:

```bash
# Access BullMQ dashboard
http://localhost:3001/admin/queues
```

## Testing

### 1. Local Development

```bash
# Start the application
npm run dev

# Test OAuth flow
# 1. Go to http://localhost:3000/login
# 2. Click "Connect Google Business Profile"
# 3. Complete OAuth flow
# 4. Verify location creation and token storage
```

### 2. Production Testing

1. Update environment variables for production
2. Test with real Google Business Profile accounts
3. Verify token encryption and storage
4. Test review syncing and reply posting

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check Google Cloud Console settings
   - Verify environment variables

2. **"Access denied"**
   - User needs to grant business.manage scope
   - Check Google Business Profile permissions

3. **"Token expired"**
   - Refresh token rotation needed
   - Re-authorization required

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
LOG_LEVEL=debug
```

## Security Considerations

1. **Encryption Key Management**
   - Use different keys for different environments
   - Rotate keys periodically
   - Store keys securely (not in code)

2. **Token Scope**
   - Only request necessary scopes
   - Regularly audit token usage

3. **Data Privacy**
   - Encrypt sensitive data at rest
   - Implement data retention policies
   - Comply with GDPR/CCPA requirements

## Performance Optimization

1. **Caching**
   - Cache Google API responses
   - Implement Redis caching for frequently accessed data

2. **Rate Limiting**
   - Respect Google API rate limits
   - Implement exponential backoff

3. **Background Processing**
   - Use queues for heavy operations
   - Implement job prioritization

## Future Enhancements

1. **Multi-account Support**
   - Support for multiple Google accounts per business
   - Account switching functionality

2. **Advanced Analytics**
   - Review sentiment analysis
   - Performance metrics and reporting

3. **Automation**
   - Smart reply suggestions
   - Automated review monitoring
   - Integration with CRM systems

