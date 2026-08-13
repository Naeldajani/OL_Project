-- Lugdun'Home — schéma Supabase
--
-- À exécuter dans Supabase > SQL Editor, puis renseigner dans un fichier .env
-- à la racine du projet :
--   VITE_SUPABASE_URL=https://xxxxx.supabase.co
--   VITE_SUPABASE_ANON_KEY=eyJhbG...
-- L'app bascule automatiquement du mode local au mode partagé.
--
-- Identité : chaque navigateur génère un uuid stocké localement, il n'y a
-- pas de mot de passe. Les policies ci-dessous autorisent donc l'écriture
-- anonyme, mais chaque ligne reste unique par (utilisateur, match), ce qui
-- empêche de voter deux fois.

create table if not exists profiles (
  id uuid primary key,
  pseudo text not null default 'Gone anonyme',
  avatar text not null default '🦁',
  "createdAt" timestamptz not null default now()
);

create table if not exists player_ratings (
  match_id text not null,
  player_id text not null,
  user_id uuid not null references profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 10),
  created_at timestamptz not null default now(),
  primary key (match_id, player_id, user_id)
);

create table if not exists motm_votes (
  match_id text not null,
  user_id uuid not null references profiles(id) on delete cascade,
  player_id text not null,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create table if not exists debate_votes (
  match_id text not null,
  user_id uuid not null references profiles(id) on delete cascade,
  option_id text not null,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create table if not exists predictions (
  match_id text not null,
  user_id uuid not null references profiles(id) on delete cascade,
  home_score smallint not null check (home_score >= 0),
  away_score smallint not null check (away_score >= 0),
  scorer_id text,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create index if not exists player_ratings_match_idx on player_ratings (match_id);
create index if not exists motm_votes_match_idx on motm_votes (match_id);
create index if not exists debate_votes_match_idx on debate_votes (match_id);
create index if not exists predictions_user_idx on predictions (user_id);

alter table profiles enable row level security;
alter table player_ratings enable row level security;
alter table motm_votes enable row level security;
alter table debate_votes enable row level security;
alter table predictions enable row level security;

-- Lecture publique : les agrégats communautaires sont le produit.
create policy "lecture publique profiles" on profiles for select using (true);
create policy "lecture publique notes" on player_ratings for select using (true);
create policy "lecture publique hdm" on motm_votes for select using (true);
create policy "lecture publique debats" on debate_votes for select using (true);
create policy "lecture publique pronos" on predictions for select using (true);

-- Écriture anonyme autorisée ; l'unicité par clé primaire empêche le
-- bourrage d'urnes depuis un même profil.
create policy "ecriture profiles" on profiles for insert with check (true);
create policy "maj profiles" on profiles for update using (true) with check (true);
create policy "ecriture notes" on player_ratings for insert with check (true);
create policy "maj notes" on player_ratings for update using (true) with check (true);
create policy "ecriture hdm" on motm_votes for insert with check (true);
create policy "maj hdm" on motm_votes for update using (true) with check (true);
create policy "ecriture debats" on debate_votes for insert with check (true);
create policy "maj debats" on debate_votes for update using (true) with check (true);
create policy "ecriture pronos" on predictions for insert with check (true);
create policy "maj pronos" on predictions for update using (true) with check (true);
