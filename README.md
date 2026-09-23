# Sociall — Task 2 Social Media Platform

A complete mini social media platform built for the CodeAlpha internship Task 2.

**Frontend:** HTML, CSS, Vanilla JavaScript  
**Backend:** Node.js + Express.js  
**Database:** Supabase PostgreSQL + Storage  
**Authentication:** Express + JWT + bcrypt

## Features

- User signup/login/logout
- User profiles and profile editing
- Create/delete text and image posts
- Comments
- Likes/unlikes
- Follow/unfollow
- Followers/following lists
- User search/discover
- Responsive animated UI
- Supabase Storage for images

## 1. Supabase Setup

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Run the complete `database/schema.sql`.
4. Open **Project Settings → API Keys** and copy the Project URL and server-side secret key.
5. Keep the server-side secret key only in the backend `.env` file.

## 2. Backend Setup

Open a terminal in `backend/`.

### Windows

```powershell
Copy-Item .env.example .env
npm install
npm run dev