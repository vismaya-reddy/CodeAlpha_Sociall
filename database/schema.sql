-- =========================================================
-- Sociall — Supabase PostgreSQL schema
-- Run this entire file in Supabase SQL Editor
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- USERS ----------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  username varchar(20) unique not null,
  email varchar(255) unique not null,
  password_hash text not null,
  bio varchar(250) default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

-- ---------- POSTS ----------
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content text default '',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_user_id_fkey foreign key (user_id) references users(id) on delete cascade,
  constraint posts_content_or_image check (content <> '' or image_url is not null)
);

-- ---------- COMMENTS ----------
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  user_id uuid not null,
  content varchar(500) not null,
  created_at timestamptz not null default now(),
  constraint comments_post_id_fkey foreign key (post_id) references posts(id) on delete cascade,
  constraint comments_user_id_fkey foreign key (user_id) references users(id) on delete cascade
);

-- ---------- LIKES ----------
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint likes_post_id_fkey foreign key (post_id) references posts(id) on delete cascade,
  constraint likes_user_id_fkey foreign key (user_id) references users(id) on delete cascade,
  constraint likes_unique unique (post_id, user_id)
);

-- ---------- FOLLOWERS ----------
create table if not exists followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null,
  following_id uuid not null,
  created_at timestamptz not null default now(),
  constraint followers_follower_id_fkey foreign key (follower_id) references users(id) on delete cascade,
  constraint followers_following_id_fkey foreign key (following_id) references users(id) on delete cascade,
  constraint followers_unique unique (follower_id, following_id),
  constraint followers_no_self_follow check (follower_id <> following_id)
);

-- ---------- INDEXES ----------
create index if not exists idx_posts_user_id on posts(user_id);
create index if not exists idx_posts_created_at on posts(created_at desc);
create index if not exists idx_comments_post_id on comments(post_id);
create index if not exists idx_comments_user_id on comments(user_id);
create index if not exists idx_likes_post_id on likes(post_id);
create index if not exists idx_likes_user_id on likes(user_id);
create index if not exists idx_followers_follower_id on followers(follower_id);
create index if not exists idx_followers_following_id on followers(following_id);
create index if not exists idx_users_username on users(username);
create index if not exists idx_users_email on users(email);

-- ---------- AUTO updated_at TRIGGER ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

drop trigger if exists trg_posts_updated_at on posts;
create trigger trg_posts_updated_at before update on posts
  for each row execute function set_updated_at();

-- ---------- ROW LEVEL SECURITY ----------
-- Safe to run again: remove policies created by this schema first.
-- The Express backend authenticates using the SUPABASE SERVICE ROLE KEY,
-- which bypasses RLS entirely. RLS is enabled below as defense-in-depth
-- so that if the anon/public key were ever exposed, only reads are allowed.
alter table users enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table followers enable row level security;

drop policy if exists "Public read access" on users;
drop policy if exists "Public read access" on posts;
drop policy if exists "Public read access" on comments;
drop policy if exists "Public read access" on likes;
drop policy if exists "Public read access" on followers;

create policy "Public read access" on users for select using (true);
create policy "Public read access" on posts for select using (true);
create policy "Public read access" on comments for select using (true);
create policy "Public read access" on likes for select using (true);
create policy "Public read access" on followers for select using (true);
-- No insert/update/delete policies exist for anon/public — all writes
-- must go through the Express backend using the service role key.

-- ---------- STORAGE BUCKETS ----------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Public read for both buckets; writes only via backend (service role bypasses RLS)
drop policy if exists "Public read avatars" on storage.objects;
drop policy if exists "Public read post-images" on storage.objects;

create policy "Public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Public read post-images" on storage.objects
  for select using (bucket_id = 'post-images');
