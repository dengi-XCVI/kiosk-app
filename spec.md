# Kiosk - Application Specification

> A content publishing platform where users can write articles and get paid via x402 micropayment technology.

**Last Updated:** February 15, 2026

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
│   │   │   ├── journals/       # Journal CRUD & member management
│   │   │   ├── uploadthing/   # UploadThing file router
│   │   │   └── users/         # User search API
│   │   ├── article/[articleId]/ # Article reading view
│   │   ├── journals/
│   │   │   ├── [slug]/        # Journal public page
│   │   │   └── manage/[userId]/ # Journal management page
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
  purchases     ArticlePurchase[]
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
  journalId    String?  // Optional journal association
  images       Image[]
  purchases    ArticlePurchase[]
  journal      Journal? @relation(fields: [journalId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

#### ArticlePurchase
```prisma
model ArticlePurchase {
  id         String   @id @default(cuid())
  userId     String
  articleId  String
  amountPaid Int      // Captured price paid at purchase time
  createdAt  DateTime @default(now())

  @@unique([userId, articleId])
}
```

#### Journal
```prisma
model Journal {
  id          String          @id @default(cuid())
  name        String
  slug        String          @unique
  description String?
  logoUrl     String?
  articles    Article[]
  members     JournalMember[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}
```

#### JournalMember
```prisma
enum JournalRole {
  ADMIN
  WRITER
}

model JournalMember {
  id        String      @id @default(cuid())
  role      JournalRole @default(WRITER)
  userId    String
  journalId String
  user      User        @relation(fields: [userId], references: [id])
  journal   Journal     @relation(fields: [journalId], references: [id])
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@unique([userId, journalId])
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
| `20260208180129_add_journals` | Added Journal, JournalMember models, JournalRole enum, and journalId FK on Article |
| `20260215160211_add_article_purchases` | Added ArticlePurchase model and relations for paid article ownership |

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
| `POST` | Create article with title, TipTap JSON content, optional thumbnailUrl, optional price (1-5 USD), and optional journalId. Validates journal membership if journalId provided. Links orphan images including thumbnail. |
| `GET` | Get current user's articles with images |

### `/api/journals`

| Method | Description |
|--------|-------------|
| `POST` | Create a new journal with name and optional description. Auto-generates URL slug. Creates an ADMIN membership for the creator in a transaction. |
| `GET` | Get the current user's journal memberships with full journal details (used by PublishModal journal picker and management page). |

### `/api/journals/members`

| Method | Description |
|--------|-------------|
| `GET` | Get all members of a journal. Requires ADMIN role. Query param: `journalId`. |
| `POST` | Add a writer to a journal by email address. Requires ADMIN role. Prevents duplicate memberships. |
| `DELETE` | Remove a member from a journal. Requires ADMIN role. Cannot remove yourself. |
| `PATCH` | Change a member's role (ADMIN ↔ WRITER). Requires ADMIN role. If the change leaves zero admins, the journal is automatically deleted (all members removed, articles unlinked). |

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
| `/article/[articleId]` | `app/article/[articleId]/page.tsx` | Article reading view + paid-access banner for unpaid non-authors |
| `/journals/[slug]` | `app/journals/[slug]/page.tsx` | Journal public page (header + article grid) |
| `/journals/manage/[userId]` | `app/journals/manage/[userId]/page.tsx` | Journal management (create, list, manage members) |
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
| `Article.tsx` | Reusable article card component showing thumbnail, title, date, author, and optional journal badge |
| `FullArticle.tsx` | Full article reading view — renders TipTap JSON content with thumbnail hero, title, journal badge, author row, price badge, and paid-access banner with a placeholder pay button |
| `PublishModal.tsx` | Modal dialog for confirming article publish with thumbnail upload, price selection ($1-$5 or free), and optional journal picker |

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
export async function getArticleById(articleId: string, viewerUserId?: string) { ... }
export async function getJournalBySlug(slug: string) { ... }
export async function getArticlesByJournalId(journalId: string) { ... }
export async function getJournalMembershipsByUserId(userId: string) { ... }
export async function getJournalMembers(journalId: string) { ... }
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
5. User optionally selects a journal to publish under (dropdown shows their memberships)
6. User confirms publish → `POST /api/articles` creates article with:
   - `title`, `content` (TipTap JSON), `thumbnailUrl` (optional), `price` (null for free, 1-5 for paid), `journalId` (optional)
7. API validates price (must be integer 1-5 or null) and journal membership (if journalId provided)
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
- [x] Add journal system (create, manage members, publish under journals)
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

export interface ArticleJournal {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
}

export interface Journal {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface JournalMembership {
    id: string;
    role: "ADMIN" | "WRITER";
    journal: Journal;
}

export interface JournalMemberEntry {
    id: string;
    role: "ADMIN" | "WRITER";
    user: { id: string; name: string | null; email: string; image: string | null };
}

export interface Article {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    price: number | null;  // Price in USD (1-5), null = free
    createdAt: Date;
    updatedAt: Date;
    user: ArticleAuthor;
    journal: ArticleJournal | null;  // Journal this article belongs to
}

export interface FullArticle extends Article {
    content: TipTapNode;   // TipTap JSON content tree
    hasPurchased?: boolean; // True when current viewer has an ArticlePurchase row
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
