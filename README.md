# Sociall — Task 2 Social Media Platform

A complete mini social media platform built for the internship Task 2.

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

## 1. Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Run the complete `database/schema.sql`.
4. Open **Project Settings → API** and copy the Project URL and `service_role` key.
5. Keep the service-role key only in the backend `.env` file.

## 2. Backend setup

Open a terminal in `backend/`.

### Windows PowerShell

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Edit `.env` and add:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_long_random_secret
```

The API runs at `http://localhost:5000`.

Test it at:

`http://localhost:5000/api/health`

## 3. Frontend setup

The frontend is plain HTML/CSS/JavaScript.

Use VS Code **Live Server** and open:

`frontend/index.html`

The default frontend URL is `http://localhost:5500`.

If you use another frontend port, update `CLIENT_URL` in `backend/.env`.

If the backend URL changes, update `API_BASE_URL` in `frontend/js/config.js`.

## 4. Project structure

```text
project/
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── profile.html
│   ├── discover.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── config.js
│       ├── api.js
│       ├── toast.js
│       ├── nav.js
│       ├── auth.js
│       ├── feed.js
│       ├── profile.js
│       └── discover.js
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   └── supabase.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── users.controller.js
│   │   ├── follow.controller.js
│   │   ├── posts.controller.js
│   │   └── comments.controller.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── posts.routes.js
│   │   └── comments.routes.js
│   └── utils/
│       ├── validators.js
│       └── storage.js
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## API

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users/search?q=`
- `GET /api/users/:username`
- `PUT /api/users/me`
- `POST /api/users/:username/follow`
- `GET /api/users/:username/followers`
- `GET /api/users/:username/following`
- `GET /api/posts`
- `POST /api/posts`
- `GET /api/posts/user/:username`
- `DELETE /api/posts/:id`
- `POST /api/posts/:postId/like`
- `GET /api/posts/:postId/comments`
- `POST /api/posts/:postId/comments`
- `DELETE /api/comments/:id`

## Security

- Passwords are hashed with bcrypt.
- JWT sessions protect authenticated routes.
- The Supabase service-role key is backend-only.
- Users can modify only their own posts, comments and profile.
- Database constraints prevent duplicate likes/follows and self-following.
- Supabase Storage handles profile/post images.
