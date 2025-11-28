# Getting Started with MapMingle

Welcome to MapMingle! This guide will help you set up and deploy the application.

## 🎉 What's Included

This repository includes a **production-ready** version of MapMingle with critical security fixes and quality improvements:

✅ Secure JWT-based authentication with bcrypt  
✅ Production-ready Redis rate limiting  
✅ Secure CORS configuration  
✅ Comprehensive testing framework  
✅ CI/CD pipeline with GitHub Actions  
✅ Code quality tools (ESLint + Prettier)  
✅ Railway deployment configuration  

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis (for production)
- Railway account (for deployment)
- Expo CLI for mobile development

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd apps/backend
npm install

# Install mobile dependencies
cd ../mobile
npm install
```

### 2. Set Up Environment Variables

```bash
# Backend
cd apps/backend
cp .env.production.example .env
```

Edit `.env` and add your values:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `JWT_REFRESH_SECRET` - Generate another secure secret
- `REDIS_URL` - Redis connection string (for production)

### 3. Set Up Database

```bash
cd apps/backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed database
npm run db:seed
```

### 4. Run Locally

```bash
# Terminal 1: Start backend
cd apps/backend
npm run dev

# Terminal 2: Start mobile app
cd apps/mobile
npx expo start
```

## 🌐 Deploy to Railway

### Step 1: Connect Repository

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `rogergrubb/mapandmingle`

### Step 2: Add Databases

1. Click "New" → "Database" → "Add PostgreSQL"
2. Click "New" → "Database" → "Add Redis"
3. Railway automatically sets `DATABASE_URL` and `REDIS_URL`

### Step 3: Configure Environment Variables

In Railway, add these variables:

```
NODE_ENV=production
JWT_SECRET=<your-generated-secret>
JWT_REFRESH_SECRET=<your-generated-secret>
ALLOWED_ORIGINS=https://yourdomain.com
STRIPE_SECRET_KEY=<your-stripe-key>
```

### Step 4: Deploy

Railway will automatically:
- Install dependencies
- Run Prisma migrations
- Build the application
- Start the server

Your API will be available at: `https://your-app.railway.app`

## 📱 Mobile App Configuration

Update `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-app.railway.app
EXPO_PUBLIC_WS_URL=wss://your-app.railway.app
```

## 🧪 Testing

```bash
# Run backend tests
cd apps/backend
npm test

# Run with coverage
npm run test:coverage
```

## 🔍 Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 📚 Documentation

- **IMPROVEMENTS.md** - Details on security fixes and improvements
- **README.md** - Full project documentation
- **docs/** - Privacy policy, terms of service, app store guidelines

## 🔐 Security Notes

### Critical Changes from Original

1. **Authentication**: Now uses secure JWT tokens instead of custom tokens
   - Mobile app needs to handle `accessToken` and `refreshToken`
   - See `apps/backend/src/routes/auth.ts` for API changes

2. **Rate Limiting**: Uses Redis in production
   - Prevents denial-of-service attacks
   - Scales across multiple server instances

3. **CORS**: Restricted to allowed domains
   - Configure via `ALLOWED_ORIGINS` environment variable

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
psql $DATABASE_URL

# Reset database
npm run db:push
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## 📞 Support

- Check GitHub Issues
- Review implementation guide in `IMPROVEMENTS.md`
- Refer to Railway logs for deployment issues

## 🎯 Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Configure environment variables
3. ✅ Test authentication flow
4. ✅ Deploy mobile app to Expo
5. ✅ Submit to app stores (see `docs/` for guidelines)

---

**Built with ❤️ for connecting people in the real world**
