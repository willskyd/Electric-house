# micro-mec

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_B1ebPZCKocjgTgv1Zfvou1WxxkmL)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin sign-in

The local development admin account is `adminmicro.com` with password `Admin123`. Configure `MICRO_MEC_ADMIN_EMAIL` and `MICRO_MEC_ADMIN_PASSWORD` in the server environment before deploying; production does not use development credentials. Set `JWT_SECRET` to a random secret of at least 32 characters. Sign-in creates an HTTP-only session cookie, and the API routes require that session.

Set `NEXT_PUBLIC_ADMIN_PHONE` to the administrator's phone number, including country code, to enable the call-admin links in the dashboard.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
