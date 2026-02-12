# QA RCA Coding Governance Platform

A production-ready web application for governing RCA (Root Cause Analysis) codes across multiple sites (UAE, Egypt, KSA). This platform ensures consistent RCA taxonomy through a structured proposal and approval workflow.

## Features

### MVP-1 (Current Release)
- **Authentication & User Management**: Role-based access control (QA_MEMBER, QA_LEAD, MANAGER, ADMIN)
- **RCA Library**: Hierarchical code structure with search, filtering, and export capabilities
- **Proposal Workflow**: Submit, discuss, and approve/reject RCA code proposals
- **Admin Panel**: User management and audit logging
- **Multi-site Support**: Global and site-specific codes with proper access controls

### Key Features
- **Hierarchical RCA Codes**: Main RCA (Agent/Process/Technology/Customer) + up to 5 levels
- **Real-time Similarity Detection**: Prevents duplicate codes during proposal creation
- **Comment System**: Discussion threads with reactions (Agree/Disagree/Suggest)
- **Manager Decision Panel**: Approve/Reject/Merge/Deprecate with mandatory reasons
- **Audit Logging**: Complete audit trail for all critical actions
- **CSV Export**: Export approved codes for external use
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, NextAuth.js (Credentials)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with bcrypt password hashing
- **Deployment**: Ready for Vercel, Netlify, or any Node.js hosting

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd qa-rca-governance
   npm install
   ```

2. **Set up the database:**
   ```bash
   # Create a PostgreSQL database
   createdb qa_rca_governance

   # Copy environment variables
   cp .env.example .env

   # Edit .env with your database URL and NextAuth secret
   nano .env
   ```

3. **Run database migrations and seed:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Visit `http://localhost:3000`
   - Login with demo credentials (see below)

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@qagovernance.com | Admin@123 |
| Manager (UAE) | manager.uae@qagovernance.com | Admin@123 |
| QA Lead (EG) | lead.eg@qagovernance.com | Admin@123 |
| QA Member (KSA) | member.ksa@qagovernance.com | Admin@123 |

## Project Structure

```
qa-rca-governance/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard page
│   │   ├── library/           # RCA Library pages
│   │   ├── proposals/         # Proposal pages
│   │   ├── admin/             # Admin pages
│   │   └── login/             # Login page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── layout/            # Layout components
│   └── lib/                   # Utility functions
├── middleware.ts               # Route protection
├── tailwind.config.ts          # Tailwind configuration
└── README.md
```

## Database Schema

### Core Tables
- **users**: User accounts with roles and site assignments
- **rca_codes**: Hierarchical RCA codes with approval workflow
- **comments**: Discussion threads on proposals
- **decisions**: Manager decisions with audit trail
- **audit_logs**: Complete audit trail

### Key Relationships
- Users can create proposals and comment on them
- Managers can approve/reject/merge/deprecate proposals
- Codes can be global or site-specific
- All critical actions are logged in audit_logs

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth API

### RCA Codes
- `GET /api/codes` - List approved codes (with search/filters)
- `GET /api/codes/[id]` - Get code details
- `GET /api/codes/export` - Export approved codes as CSV
- `GET /api/codes/similar` - Find similar existing codes

### Proposals
- `GET /api/proposals` - List proposals
- `POST /api/proposals` - Create new proposal
- `GET /api/proposals/[id]` - Get proposal details
- `POST /api/proposals/[id]/decision` - Manager decision
- `GET/POST /api/proposals/[id]/comments` - Comments management

### Admin
- `GET/POST /api/users` - User management
- `GET/PUT /api/users/[id]` - Individual user operations
- `GET /api/audit-logs` - Audit log queries

## User Roles & Permissions

### QA_MEMBER
- View approved RCA library
- Submit new proposals
- Comment on proposals
- View discussions

### QA_LEAD
- All QA_MEMBER permissions
- Edit pending proposals before manager decision
- Suggest merges in comments

### MANAGER
- All QA_LEAD permissions
- Approve/reject/merge proposals
- Must provide reject reason
- Can approve with edits
- View/manage all sites

### ADMIN
- All MANAGER permissions
- Manage users (create/edit/disable/assign roles)
- View all audit logs
- Full system access

## Business Rules

### Code Hierarchy
- **Main RCA**: Agent | Process | Technology | Customer
- **RCA1-RCA5**: Optional hierarchical levels (up to 5 deep)
- **Scope**: GLOBAL (all sites) or SITE (specific site only)

### Approval Workflow
1. **Proposal**: QA_MEMBER/QA_LEAD submits new code
2. **Discussion**: All users can comment and react
3. **Decision**: MANAGER/ADMIN approves/rejects/merges/deprecates
4. **Audit**: All actions logged with before/after states

### Access Control
- Users see GLOBAL codes + codes for their site
- Managers/Admins see all codes across all sites
- Deprecated codes hidden by default (toggle available)

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:migrate   # Run Prisma migrations
npm run db:push      # Push schema changes (dev)
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

### Environment Variables
```env
DATABASE_URL="postgresql://username:password@localhost:5432/qa_rca_governance"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key"
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Set up PostgreSQL database (e.g., Neon, Supabase)
4. Deploy automatically on push

### Manual Deployment
1. Build the application: `npm run build`
2. Set environment variables
3. Run migrations: `npm run db:migrate`
4. Start server: `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please create an issue in the GitHub repository.
