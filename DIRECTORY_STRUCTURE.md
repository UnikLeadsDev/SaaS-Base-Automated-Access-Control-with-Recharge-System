# Directory Structure Guide

## Production-Safe Structure

```
saas-base/
├── backend/                 # Production backend
│   ├── config/             # Database & app configuration
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth, CSRF, validation
│   ├── routes/            # API endpoints
│   ├── services/          # External services
│   ├── utils/             # Helper functions
│   ├── database/          # SQL schemas
│   ├── .env.example       # Environment template
│   └── server.js          # Main server file
│
├── frontend/               # Production frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # State management
│   │   ├── utils/         # Helper functions
│   │   └── config/        # App configuration
│   ├── .env.example       # Environment template
│   └── package.json
│
├── dev-tools/             # Development only (gitignored)
│   └── mock-server.js     # Mock API for testing
│
└── docs/                  # Documentation
    ├── ENV_SETUP.md
    ├── I18N_GUIDE.md
    └── README.md
```

## Security Notes

### ✅ Production Safe
- All `.env` files are gitignored
- Mock server isolated in `dev-tools/`
- Sensitive configs in environment variables
- Clear separation of dev/prod code

### ❌ Never Deploy
- `dev-tools/` directory
- `.env` files with real credentials
- Mock server with hardcoded data
- Development-only utilities

## Environment Files

### Backend
- `.env.example` - Template with placeholder values
- `.env` - Local development (gitignored)
- `.env.production` - Production values (deploy separately)

### Frontend  
- `.env.example` - Template with placeholder values
- `.env` - Local development (gitignored)

## Deployment Checklist

1. **Exclude from production:**
   - [ ] `dev-tools/` directory
   - [ ] All `.env` files
   - [ ] `node_modules/`
   - [ ] Development dependencies

2. **Include in production:**
   - [ ] `backend/` (without .env)
   - [ ] `frontend/dist/` (built assets)
   - [ ] `.env.example` files as templates

3. **Configure separately:**
   - [ ] Production environment variables
   - [ ] Database credentials
   - [ ] API keys and secrets