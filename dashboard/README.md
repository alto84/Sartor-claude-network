# Sartor Family Dashboard

A Next.js-powered family management dashboard that integrates with the Sartor Life system. Manage calendars, tasks, family vault, and more - all in one place.

## Features

- **Family Calendar**: Unified view of all family member schedules
- **Task Management**: Shared task lists with assignments and priorities
- **Family Vault**: Store documents, recipes, notes, and memories
- **Memory System**: AI-powered context and learning for personalized assistance
- **Real-time Updates**: Live synchronization across all family members
- **Role-based Access**: Parent, child, and admin permission levels

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or later
- **npm** 9.x or later (or yarn/pnpm)
- **Firebase Project** with Realtime Database enabled
- **Firebase Service Account** key (JSON file)

Optional:
- Google OAuth credentials (for Google Sign-In)
- Resend API key (for magic link authentication)
- Cloudflare account (for MCP Gateway deployment)

## Quick Start

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Configure Environment Variables

**Option A: Use the setup script (recommended)**

```powershell
# From the project root
.\scripts\setup-env.ps1
```

**Option B: Manual configuration**

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your values
# See "Environment Variables" section below for details
```

### 3. Set Up Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Realtime Database** in the Firebase console
3. Download your service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save as `dashboard/config/service-account.json`
4. Copy your Firebase config values to `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Secret for encrypting sessions | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app's URL | `http://localhost:3000` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | From Firebase Console |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Realtime Database URL | `https://your-project-default-rtdb.firebaseio.com` |

### Firebase Admin (Server-side)

Choose one of these options:

**Option 1: Service Account File (Development)**
```
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account.json
```

**Option 2: Individual Credentials (Production/Vercel)**
```
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Option 3: Base64 Encoded (Alternative for CI/CD)**
```
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-encoded-service-account-json>
```

### Optional Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | Resend API key for emails |
| `NEXT_PUBLIC_MCP_GATEWAY_URL` | MCP Gateway URL |
| `MCP_ACCESS_TOKEN` | MCP Gateway auth token |

### Feature Flags

```bash
NEXT_PUBLIC_ENABLE_FINANCE=false    # Enable financial dashboard
NEXT_PUBLIC_ENABLE_HEALTH=false     # Enable health tracking
NEXT_PUBLIC_ENABLE_SMART_HOME=false # Enable smart home control
```

## Project Structure

```
dashboard/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   └── ui/                 # Shadcn/UI components
├── config/                 # Configuration files
│   └── service-account.json # Firebase service account (gitignored)
├── lib/                    # Utility functions and hooks
├── public/                 # Static assets
├── .env.example           # Environment template
├── .env.local             # Your environment config (gitignored)
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy

**Important**: For Vercel deployment, use `FIREBASE_ADMIN_PRIVATE_KEY` with the full private key string, or `FIREBASE_SERVICE_ACCOUNT_BASE64` with base64-encoded credentials.

### Deploy to Other Platforms

The dashboard is a standard Next.js application and can be deployed to:

- **Netlify**: Use the Next.js plugin
- **AWS Amplify**: Supports Next.js out of the box
- **Docker**: Build with `next build` and run with `next start`
- **Self-hosted**: Use PM2 or systemd to run the Node.js server

### Environment Variables in Production

For any production deployment:

1. Set all required environment variables
2. Ensure `NEXTAUTH_URL` matches your production domain
3. Update `APP_URL` and `NEXT_PUBLIC_API_URL` accordingly
4. Use secure, randomly generated secrets

## MCP Gateway Integration

The dashboard integrates with the Sartor Life MCP Gateway (Cloudflare Worker) for advanced features:

- **Family Vault**: Document and note storage
- **Memory System**: AI context and learning
- **Chat**: Family messaging
- **Dashboard Data**: Aggregated family information

To set up the MCP Gateway:

1. Deploy the worker from `workers/sartor-life/`
2. Configure secrets in Cloudflare
3. Set `NEXT_PUBLIC_MCP_GATEWAY_URL` and `MCP_ACCESS_TOKEN` in `.env.local`

See `workers/sartor-life/DEPLOY.md` for detailed instructions.

## Authentication

The dashboard supports multiple authentication methods:

1. **Email Magic Link** (requires Resend API key)
2. **Google OAuth** (requires Google Cloud credentials)
3. **Credentials** (email/password - not recommended for production)

Configure your preferred method(s) in the NextAuth configuration.

## Troubleshooting

### Firebase Connection Failed

1. Verify your service account file is valid JSON
2. Check that Realtime Database is enabled in Firebase
3. Ensure the database URL matches your project region
4. Verify service account has database read/write permissions

### NextAuth Errors

1. Ensure `NEXTAUTH_SECRET` is set
2. Verify `NEXTAUTH_URL` matches your actual URL
3. For OAuth providers, check redirect URIs are configured

### Build Errors

1. Delete `node_modules` and `.next`, then reinstall:
   ```bash
   rm -rf node_modules .next
   npm install
   ```
2. Ensure all required environment variables are set
3. Check for TypeScript errors with `npm run lint`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Security

- Never commit `.env.local` or service account keys
- Use environment variables for all secrets
- Rotate credentials regularly
- Enable Firebase Security Rules for your database

## License

This project is part of the Sartor Claude Network. See the main repository for license information.

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Main project documentation
- [MCP Gateway Setup](../workers/sartor-life/DEPLOY.md) - Cloudflare Worker deployment
- [Environment Setup Script](../scripts/setup-env.ps1) - Automated configuration
