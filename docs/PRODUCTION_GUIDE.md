# Production Deployment Guide

## System Overview

Sartor is a multi-tier memory storage system orchestrating Firebase (hot/warm storage), GitHub (cold archival), and vector databases (semantic search). The system automatically manages memory lifecycle across tiers based on access patterns and TTL policies. Production deployments run on Firebase Functions with Realtime Database and Firestore as primary data stores.

## Prerequisites

- **Node.js**: >= 18.0.0, **npm**: >= 9.0.0
- **Firebase CLI**: `npm install -g firebase-tools`
- **Firebase Project**: Blaze (pay-as-you-go) plan required
- **GitHub Account**: For cold storage repository
- **Vector DB**: Pinecone or Weaviate (optional for semantic search)

## Environment Variables

Required `.env` configuration:

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# GitHub Integration
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=sartor-memories

# Vector Database (Optional)
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=us-west1-gcp
OPENAI_API_KEY=sk-your-openai-key

# Application
PORT=3000
NODE_ENV=production
```

## Deployment Steps

```bash
# 1. Install and authenticate
npm install
firebase login

# 2. Configure Firebase (first time)
npm run setup:firebase
# Update /config/firebase-config.json with actual project values

# 3. Build and deploy
npm run build
npm run deploy:firebase

# 4. Verify deployment
firebase functions:log --limit 10
curl https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/health
```

## Monitoring & Health Checks

**Key Metrics**:

- Realtime Database: connections, data usage
- Firestore: read/write ops, document count
- Functions: execution time, error rate, memory
- Storage: tier usage

**Health Endpoint**: Monitor tier status, DB connectivity, sync timestamps

## Troubleshooting

**Functions Timeout**: Increase timeout in `firebase.json` or reduce batch sizes in config

**PERMISSION_DENIED Errors**: Verify database rules and service account permissions

**Firestore 500 Writes/Batch Limit**: Reduce `maxBatchSize` in `/config/firebase-config.json`

**GitHub API Rate Limits**: Use authenticated token, implement exponential backoff

**OOM in Functions**: Review TTL cleanup intervals, reduce cache sizes in config

**Missing Environment Variables**: Check `.env` file or run `firebase functions:config:get`

---

**Reference**: [Implementation Guide](/docs/implementation-guide.md) | [Architecture](/docs/ARCHITECTURE.md)
