# Electric house

Electric house is a full inventory, sales, debt, and operations dashboard for a modern retail or wholesale stock system. It combines product management, pending orders, returns, store transfers, customer debt tracking, and offline-ready sync workflows into a single operational workspace.

## Overview

The system is designed for daily retail operations and store-level stock control. It gives staff the ability to:

- manage products, pricing, categories, and stock counts
- track incoming stock and stock movement across branches
- monitor customer debt and payment status
- process pending orders and returns
- sync changes when online while preserving offline edits
- access a focused dashboard for overview, stock, returns, and sync operations

## Features

- Inventory overview and stock insights
- Product catalog with search, filters, and low-stock alerts
- Stock receipts, returns, and pending order tracking
- Customer debt and payment management
- Store transfer workflows between branches or locations
- Offline queue and sync center for resilient local updates
- Admin sign-in with secure session-based authentication
- Responsive dashboard for desktop and mobile use

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- MongoDB / server-side data access
- IndexedDB for local offline queue storage
- Vercel Analytics integration

## Project structure

```text
app/                  # App routes and dashboard page
components/           # Reusable UI and dashboard components
lib/                  # Auth utilities, data helpers, and offline sync logic
public/               # Static assets and icons
README.md             # Project documentation
package.json          # Project scripts and dependencies
next.config.mjs       # Next.js configuration
```

## Getting started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Then open http://localhost:3000 in your browser.

## Default local admin login

For local development, the app uses the following default administrator account when environment variables are not configured:

- Username: `electrichouse.com`
- Password: `Electric123`

When deploying, configure the real credentials using environment variables instead of relying on the local defaults:

```bash
ELECTRIC_HOUSE_ADMIN_EMAIL=electrichouse.com
ELECTRIC_HOUSE_ADMIN_PASSWORD=Electric123
JWT_SECRET=replace-with-a-long-random-secret
```

## Environment variables

The project supports the following configuration values:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
ELECTRIC_HOUSE_ADMIN_EMAIL=electrichouse.com
ELECTRIC_HOUSE_ADMIN_PASSWORD=Electric123
JWT_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_SECRET=replace-with-a-long-random-secret

# Optional app settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_PHONE=+2348000000000
NODE_ENV=development
```

## Dashboard modules

The workspace includes the main operating sections:

- Overview: summary of performance and key operational metrics
- Stocks: product inventory and stock maintenance
- New Stocks: receiving and adding inventory items
- Store: store operations and working stock views
- Transfers: stock movement between locations or branches
- Returns: returned items and refund workflows
- Pending: outstanding actions and pending orders
- Debt: customer debt tracking and payment statuses
- Sync Center: queued and online/offline synchronization controls
- Settings: workspace preferences and configuration

## Offline and sync behavior

The application keeps a local offline queue in the browser so that actions can be retried when the internet connection is unstable. The sync center monitors connectivity and allows users to push queued changes back to the server once online.

## Deployment notes

For production or staging deployments:

1. set all required environment variables in your hosting platform
2. use your real admin credentials instead of the local fallback values
3. ensure `JWT_SECRET` is at least 32 characters long
4. redeploy after changing environment settings

## License

This project is for internal business use and is configured as a private application workspace.
