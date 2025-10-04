# Render Deployment Guide

## 🚀 Deploying GMB Optimizer to Render

This guide will help you deploy your GMB Optimizer application to Render.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Google OAuth Credentials**: Set up Google OAuth for production
4. **OpenAI API Key**: Get your OpenAI API key

## 🗄️ Step 1: Create Database Services

### PostgreSQL Database
1. Go to Render Dashboard → New → PostgreSQL
2. Name: `gmb-optimizer-db`
3. Plan: Starter (Free)
4. Note the connection string

### Redis Cache
1. Go to Render Dashboard → New → Redis
2. Name: `gmb-optimizer-redis`
3. Plan: Starter (Free)
4. Note the connection string

## 🔧 Step 2: Deploy Backend Service

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: `gmb-optimizer-backend`
   - **Root Directory**: `apps/backend`
   - **Environment**: `Node`
   - **Build Command**: `npm ci --production=false && npm run build:prod`
   - **Start Command**: `node --max-old-space-size=512 dist/main`
   - **Plan**: Starter (Free)

### Environment Variables for Backend:
```
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=512
DATABASE_URL=<from PostgreSQL service>
REDIS_URL=<from Redis service>
JWT_SECRET=<generate random string>
ENCRYPTION_KEY=<generate 32-character string>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
OPENAI_API_KEY=<your-openai-api-key>
FRONTEND_URL=https://gmb-optimizer-frontend.onrender.com
```

## 🌐 Step 3: Deploy Frontend Service

1. Go to Render Dashboard → New → Static Site
2. Connect your GitHub repository
3. Configure:
   - **Name**: `gmb-optimizer-frontend`
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `out`
   - **Plan**: Starter (Free)

### Environment Variables for Frontend:
```
NEXT_PUBLIC_API_URL=https://gmb-optimizer-backend.onrender.com/api
```

## 🔑 Step 4: Set Up Google OAuth for Production

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Google+ API
   - Google Business Profile API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://gmb-optimizer-backend.onrender.com/api/auth/google/callback`
5. Copy Client ID and Client Secret to Render environment variables

## 🗃️ Step 5: Database Migration

After backend deployment:
1. Go to your backend service on Render
2. Open the Shell tab
3. Run: `npx prisma migrate deploy`
4. Run: `npx prisma generate`

## 🔄 Step 6: Update Frontend API URL

Update your frontend's API calls to use the production backend URL:
- Development: `http://localhost:3002/api`
- Production: `https://gmb-optimizer-backend.onrender.com/api`

## 📝 Step 7: Test Deployment

1. Visit your frontend URL: `https://gmb-optimizer-frontend.onrender.com`
2. Test Google OAuth flow
3. Verify database connections
4. Check all API endpoints

## 🚨 Important Notes

### Free Tier Limitations:
- Services sleep after 15 minutes of inactivity
- Cold start takes ~30 seconds
- Limited to 750 hours/month per service

### Production Considerations:
- Upgrade to paid plans for better performance
- Set up custom domains
- Configure SSL certificates
- Set up monitoring and alerts

## 🔧 Troubleshooting

### Common Issues:
1. **Memory Allocation Errors**: 
   - Use `NODE_OPTIONS=--max-old-space-size=512` environment variable
   - Use `npm run build:prod` instead of `npm run build`
   - Consider upgrading to a paid plan for more memory
2. **Build Failures**: Check build logs in Render dashboard
3. **Database Connection**: Verify DATABASE_URL format
4. **OAuth Errors**: Check redirect URIs in Google Console
5. **CORS Issues**: Verify FRONTEND_URL in backend environment

### Logs:
- Backend logs: Render Dashboard → Your Service → Logs
- Build logs: Render Dashboard → Your Service → Build Logs

## 📞 Support

- Render Documentation: [render.com/docs](https://render.com/docs)
- Render Community: [community.render.com](https://community.render.com)
