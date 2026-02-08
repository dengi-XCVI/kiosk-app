# Kiosk - Application Specification

> A content publishing platform where users can write articles and get paid via x402 micropayment technology.

**Last Updated:** February 8, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication](#authentication)
6. [API Routes](#api-routes)
7. [Pages & Routes](#pages--routes)
8. [Components](#components)
9. [Core Libraries](#core-libraries)
10. [Image Handling](#image-handling)
11. [Web3 Integration](#web3-integration)
12. [Environment Variables](#environment-variables)
13. [Development & Deployment](#development--deployment)
14. [TODO / Future Work](#todo--future-work)

---

## Overview

**Kiosk** is a Next.js 16 application that enables users to:
- Create and publish rich-text articles using a TipTap editor
- Upload images that are stored via UploadThing
- Authenticate via email/password or social providers (Google, GitHub)
- Connect Web3 wallets for x402 micropayments (planned)
- Search for and view other users' profiles

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.1.1 (App Router) |
| **Language** | TypeScript 5.x |
| **Database** | PostgreSQL via Prisma ORM 7.2 |
| **Authentication** | better-auth 1.4.10 |
| **File Storage** | UploadThing 7.7.4 |
| **Rich Text Editor** | TipTap 3.15.x |
| **Styling** | Tailwind CSS 4.x + SCSS |
| **Web3** | wagmi 3.x, viem 2.x, RainbowKit 2.2.x |
| **State Management** | TanStack Query 5.x |
| **UI Components** | Radix UI, Lucide Icons |
| **Deployment** | Vercel |

---

## Project Structure

```
kiosk/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Database seeding script
│   └── migrations/            # Database migrations
├── public/
│   └── images/                # Static images
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout with Web3Provider
│   │   ├── page.tsx           # Home page
│   │   ├── globals.css        # Global styles
│   │   ├── api/               # API routes
│   │   │   ├── articles/      # Article CRUD
│   │   │   ├── auth/[...all]/ # better-auth handler
│   │   │   ├── cron/          # Scheduled jobs
│   │   │   ├── images/        # Image tracking API
│   │   │   ├── uploadthing/   # UploadThing file router
│   │   │   └── users/         # User search API
│   │   ├── profile/           # Profile pages
│   │   ├── sign-in/           # Sign in page
│   │   ├── sign-up/           # Sign up page
│   │   └── write/             # Article editor page
│   ├── components/
│   │   ├── editor/            # TipTap editor components
│   │   │   ├── tiptap-extension/
│   │   │   ├── tiptap-icons/
│   │   │   ├── tiptap-node/
│   │   │   ├── tiptap-templates/
│   │   │   ├── tiptap-ui/
│   │   │   └── tiptap-ui-primitive/
│   │   ├── icons/             # Custom SVG icons
│   │   ├── layout/            # Layout components (Header, etc.)
│   │   ├── providers/         # React context providers
│   │   └── ui/                # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility modules
│   ├── styles/                # SCSS partials
│   └── types/                 # TypeScript type definitions
├── package.json
├── tsconfig.json
├── next.config.ts
├── vercel.json                # Vercel cron configuration
└── spec.md                    # This file
```

---

## Database Schema

Located in `prisma/schema.prisma`. Uses PostgreSQL with Prisma ORM.

### Models

#### User
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]
  images        Image[]
  articles      Article[]
}
```

#### Session
Manages user authentication sessions for better-auth.

#### Account
Links social provider accounts (Google, GitHub) to users. Supports account linking.

#### Verification
Stores email verification tokens.

#### Image
```prisma
model Image {
  id        String   @id @default(cuid())
  url       String
  key       String   @unique  // UploadThing file key for deletion
  userId    String
  articleId String?            // null = orphan (not yet in article)
  createdAt DateTime @default(now())
}
```

#### Article
```prisma
model Article {
  id           String   @id @default(cuid())
  title        String
  content      Json     // TipTap JSON content
  thumbnailUrl String?  // Thumbnail image URL
  price        Int?     // Price in USD (1-5), null = free
  userId       String
  images       Image[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Migrations

| Migration | Description |
|-----------|-------------|
| `20251227210102_init` | Initial schema |
| `20260103143351_add_better_auth` | Added better-auth models |
| `20260110144510_add_image_article_models` | Added Image and Article models |
| `20260125184223_add_article_thumbnail` | Added thumbnailUrl to Article model |
| `20260208140202_add_article_price` | Added optional price field (1-5 USD) to Article model |

---

## Authentication

Uses **better-auth** library with Prisma adapter.

### Configuration (`src/lib/auth.ts`)

```typescript
export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: { enabled: true },
    socialProviders: {
        google: { clientId, clientSecret },
        github: { clientId, clientSecret },
    },
    account: {
        accountLinking: { enabled: true },
    }
});
```

### Client (`src/lib/auth-client.ts`)

```typescript
export const authClient = createAuthClient({
    baseURL: "http://localhost:3000"
})
```

### Features
- **Email/Password** sign up and sign in
- **Social OAuth** with Google and GitHub
- **Account Linking** - same email = same account across providers
- **Session Management** via `authClient.useSession()` hook

### Auth Routes
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page
- `/api/auth/[...all]` - better-auth API handler

---

## API Routes

### `/api/articles`

| Method | Description |
|--------|-------------|
| `POST` | Create article with title, TipTap JSON content, optional thumbnailUrl, and optional price (1-5 USD). Links orphan images including thumbnail. |
| `GET` | Get current user's articles with images |

### `/api/images`

| Method | Description |
|--------|-------------|
| `POST` | Save image record to DB after UploadThing upload (creates orphan) |
| `DELETE` | Delete image from UploadThing and DB (verifies ownership) |

### `/api/uploadthing`
UploadThing file router with:
- **imageUploader** route: max 4MB, 1 image per upload
- Requires authenticated user
- Returns `url` and `key` on complete

### `/api/users/searchByName`
Search users by name for the search feature.

### `/api/cron/cleanup-images`
Scheduled job to delete orphan images older than 24 hours.
- Protected by `CRON_SECRET` environment variable
- Runs daily at 3 AM (configured in `vercel.json`)

---

## Pages & Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Home page (currently minimal) |
| `/sign-in` | `app/sign-in/page.tsx` | Email/social sign in |
| `/sign-up` | `app/sign-up/page.tsx` | Email/social registration |
| `/write` | `app/write/page.tsx` | TipTap article editor with publish |
| `/article/[articleId]` | `app/article/[articleId]/page.tsx` | Article reading view (full content) |
| `/profile` | `app/profile/page.tsx` | User profile |
| `/profile/[userId]` | `app/profile/[userId]/page.tsx` | Public user profile |
| `/simple` | `app/simple/page.tsx` | Minimal editor demo |

---

## Components

### Layout Components (`src/components/layout/`)

| Component | Description |
|-----------|-------------|
| `Header.tsx` | Main navigation with search, wallet connect, write button, user menu |
| `SearchUsers.tsx` | Debounced user search with dropdown results |
| `UserButton.tsx` | Auth state-aware user menu (login options or user dropdown) |
| `ConnectWalletButton.tsx` | RainbowKit wallet connection button |
| `WriteButton.tsx` | Navigation to /write page |
| `UserListItem.tsx` | User display in search results |

### Editor Components (`src/components/editor/`)

The TipTap editor is highly modular:

| Folder | Contents |
|--------|----------|
| `tiptap-templates/simple/` | Main `SimpleEditor` component |
| `tiptap-ui/` | Editor toolbar buttons and menus |
| `tiptap-ui-primitive/` | Base UI primitives (Button, Toolbar, etc.) |
| `tiptap-node/` | Custom TipTap node extensions |
| `tiptap-icons/` | SVG icons for editor toolbar |
| `tiptap-extension/` | Custom TipTap extensions |

#### TipTap Extensions Used
- StarterKit (bold, italic, headings, lists, etc.)
- Image
- TaskList / TaskItem
- TextAlign
- Typography
- Highlight
- Subscript / Superscript
- Selection
- ImageUploadNode (custom)
- HorizontalRule (custom)

### Providers (`src/components/providers/`)

| Component | Description |
|-----------|-------------|
| `Web3Provider.tsx` | Wraps app with Wagmi, RainbowKit, and TanStack Query |

### UI Components (`src/components/ui/`)

| Component | Description |
|-----------|-------------|
| `Article.tsx` | Reusable article card component showing thumbnail, title, date, and author |
| `FullArticle.tsx` | Full article reading view — renders TipTap JSON content with thumbnail hero, title, author row, price badge, and all block/inline formatting |
| `PublishModal.tsx` | Modal dialog for confirming article publish with thumbnail upload and price selection ($1-$5 or free) |

### Icons (`src/components/icons/`)

| Component | Description |
|-----------|-------------|
| `GoogleIcon.tsx` | Google brand icon |
| `GitHubIcon.tsx` | GitHub brand icon |

---

## Core Libraries

### `src/lib/auth.ts`
Server-side better-auth configuration.

### `src/lib/auth-client.ts`
Client-side auth helper for React components.

### `src/lib/db.ts`
Prisma client with PostgreSQL adapter.

```typescript
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
export const prisma = new PrismaClient({ adapter });
```

### `src/lib/uploadthing.ts`
UploadThing React helpers.

```typescript
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
```

### `src/lib/wagmi.ts`
Web3 wallet configuration with RainbowKit.

```typescript
export const config = getDefaultConfig({
  appName: "Kiosk",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
});
```

### `src/lib/getters.ts`
Database query helper functions.

```typescript
export async function getArticlesByUserId(userId: string) { ... }
export async function getUserById(userId: string) { ... }
export async function getArticleById(articleId: string) { ... }
```

### `src/lib/tiptap-utils.ts`
TipTap utility functions including `handleImageUpload`.

---

## Image Handling

### Upload Flow

1. User drops/pastes image in TipTap editor
2. `handleImageUpload` in `tiptap-utils.ts` triggers
3. Image uploaded to UploadThing via `imageUploader` route
4. On success, image record saved to DB via `POST /api/images`
5. Image marked as "orphan" (`articleId = null`)

### Publish Flow

1. User clicks "Publish" button on `/write` page
2. **PublishModal** opens with:
   - Article title preview
   - Thumbnail image upload (optional, drag & drop or click)
   - Price selector: Free, $1, $2, $3, $4, or $5
   - Cancel and Confirm buttons
3. If user uploads thumbnail:
   - Image uploaded to UploadThing (same as content images)
   - Saved to DB as orphan via `POST /api/images`
4. User selects a price (defaults to Free)
5. User confirms publish → `POST /api/articles` creates article with:
   - `title`, `content` (TipTap JSON), `thumbnailUrl` (optional), `price` (null for free, 1-5 for paid)
6. API validates price (must be integer 1-5 or null)
7. API extracts image URLs from TipTap JSON content
8. All orphan images (content + thumbnail) are linked to the new article
9. If user cancels, thumbnail remains orphan and will be cleaned up by cron

### Cleanup Flow

1. Cron job runs daily at 3 AM
2. `GET /api/cron/cleanup-images` finds orphans older than 24 hours
3. Images deleted from UploadThing (including unpublished thumbnails)
4. Records deleted from database

---

## Web3 Integration

### Current State
- **Wallet Connection**: RainbowKit ConnectButton integrated
- **Chains Supported**: Ethereum Mainnet, Polygon, Optimism, Arbitrum, Base
- **x402 Payments**: Not yet implemented

### Planned Features
- x402 micropayments for article access (price per article is set by author, $1-$5)
- Creator earnings dashboard
- Payment history

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# UploadThing
UPLOADTHING_TOKEN=

# Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# Cron Security
CRON_SECRET=
```

---

## Development & Deployment

### Local Development

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Scripts

| Script | Command |
|--------|---------|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint` |

### Deployment

Deployed on **Vercel** with:
- Automatic deployments from Git
- Cron job for image cleanup (via `vercel.json`)
- Environment variables configured in Vercel dashboard

---

## TODO / Future Work

### High Priority
- [ ] Implement x402 micropayment integration
- [ ] Complete home page with article feed
- [x] Add article reading view page
- [ ] User profile page with published articles

### Medium Priority
- [ ] Article editing (update existing articles)
- [ ] Article deletion
- [ ] Image management in editor (delete while editing)
- [ ] Better error handling and user feedback

### Low Priority
- [ ] Article categories/tags
- [ ] Search articles
- [ ] Comments system
- [ ] Follow/follower system
- [ ] Email notifications
- [ ] Dark mode

---

## Hooks Reference

| Hook | Location | Purpose |
|------|----------|---------|
| `use-tiptap-editor` | `hooks/` | TipTap editor instance |
| `use-is-breakpoint` | `hooks/` | Responsive breakpoint detection |
| `use-window-size` | `hooks/` | Window dimensions |
| `use-cursor-visibility` | `hooks/` | Cursor visibility for editor |
| `use-scrolling` | `hooks/` | Scroll state detection |
| `use-composed-ref` | `hooks/` | Compose multiple refs |
| `use-element-rect` | `hooks/` | Element dimensions |
| `use-menu-navigation` | `hooks/` | Keyboard navigation in menus |
| `use-throttled-callback` | `hooks/` | Throttle function calls |
| `use-unmount` | `hooks/` | Cleanup on unmount |

---

## Types Reference

### `src/types/types.ts`

```typescript
export interface User {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ArticleAuthor {
    id: string;
    name: string | null;
    image: string | null;
}

export interface Article {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    price: number | null;  // Price in USD (1-5), null = free
    createdAt: Date;
    updatedAt: Date;
    user: ArticleAuthor;
}

export interface FullArticle extends Article {
    content: TipTapNode;   // TipTap JSON content tree
}

export interface TipTapMark {
    type: string;
    attrs?: Record<string, any>;
}

export interface TipTapNode {
    type: string;
    attrs?: Record<string, any>;
    content?: TipTapNode[];
    text?: string;
    marks?: TipTapMark[];
}
```

---

*This specification is a living document. Update it as the project evolves.*
