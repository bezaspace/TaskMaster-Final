# TaskMaster (TMR)

A comprehensive task management application built with Next.js and SQLite.

## Features

- ✅ Task management with scheduling
- 📝 Task logging and notes
- 🗑️ Soft delete system (trash)
- 📊 Activity tracking
- 🤖 AI-powered chat assistance
- 📋 Standalone notes system

## Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd tmr
npm install
```

### 2. Setup Database
```bash
npm run setup-db
```

This creates the complete SQLite database with all tables and indexes.

### 3. Environment Setup
Create a `.env.local` file:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses SQLite with the following tables:

- **tasks** - Main task management with scheduling fields
- **task_logs** - Log entries associated with tasks
- **notes** - Standalone notes system
- **activity_log** - System-wide activity tracking
- **deleted_tasks** - Soft delete system for tasks
- **deleted_task_logs** - Logs for deleted tasks

## Recovery Instructions

If you need to recreate the database from scratch:

1. Delete the existing `taskmaster.db` file (if it exists)
2. Run `npm run setup-db`
3. The complete schema will be recreated

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup-db` - Create/recreate database schema
- `npm run lint` - Run ESLint

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: SQLite3
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Development**: ESLint, TypeScript

## Project Structure

```
tmr/
├── src/app/              # Next.js app directory
│   ├── api/             # API routes
│   ├── components/      # React components
│   └── types/           # TypeScript types
├── lib/                 # Utility libraries
│   ├── db.ts           # Database connection
│   ├── activityLogger.ts # Activity logging
│   └── timeUtils.ts    # Time utilities
├── setup-database.js   # Database setup script
└── package.json
```