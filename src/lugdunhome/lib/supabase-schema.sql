-- Lugdun'Home — schéma Supabase
--
-- À exécuter dans Supabase > SQL Editor, puis renseigner à la racine du
-- projet un fichier .env :
--   VITE_SUPABASE_URL=https://xxxxx.supabase.co
--   VITE_SUPABASE_ANON_KEY=eyJhbG...
-- L'application bascule alors du mode local au mode partagé.
--
-- Identité : les comptes viennent de Supabase Auth (e-mail + mot de passe).
-- profiles.id référence auth.users(id), et chaque politique compare
-- auth.uid() à user_id : un supporter ne peut écrire que ses propres votes,
-- même en forgeant la requête à la main.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null default 'Gone anonyme',
  avatar text not null default '🦁',
  "createdAt" timestamptz not null default now()
);

create table if not exists player_ratings (
  match_id text not null,
  player_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 10),
  created_at timestamptz not null default now(),
  primary key (match_id, player_id, user_id)
);

create table if not exists motm_votes (
  match_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  player_id text not null,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create table if not exists debate_votes (
  match_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  option_id text not null,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create table if not exists predictions (
  match_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  home_score smallint not null check (home_score >= 0),
  away_score smallint not null check (away_score >= 0),
  -- option retenue pour la question bonus du match (buteur, écart, nombre
  -- de buts… la question varie d'un match à l'autre, cf. lib/bonuses.ts)
  bonus_choice text,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create index if not exists player_ratings_match_idx on player_ratings (match_id);
create index if not exists motm_votes_match_idx on motm_votes (match_id);
create index if not exists debate_votes_match_idx on debate_votes (match_id);
create index if not exists predictions_user_idx on predictions (user_id);

-- Le profil est créé à l'inscription, sans aller-retour depuis le client :
-- une inscription interrompue laisserait sinon un compte sans profil, donc
-- invisible au classement.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, pseudo, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'pseudo', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar', '🦁')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table profiles enable row level security;
alter table player_ratings enable row level security;
alter table motm_votes enable row level security;
alter table debate_votes enable row level security;
alter table predictions enable row level security;

-- Lecture publique : les agrégats communautaires sont le produit.
drop policy if exists "lecture publique profiles" on profiles;
drop policy if exists "lecture publique notes" on player_ratings;
drop policy if exists "lecture publique hdm" on motm_votes;
drop policy if exists "lecture publique debats" on debate_votes;
drop policy if exists "lecture publique pronos" on predictions;

create policy "lecture publique profiles" on profiles for select using (true);
create policy "lecture publique notes" on player_ratings for select using (true);
create policy "lecture publique hdm" on motm_votes for select using (true);
create policy "lecture publique debats" on debate_votes for select using (true);
create policy "lecture publique pronos" on predictions for select using (true);

-- Écriture réservée au propriétaire de la ligne.
drop policy if exists "ecriture profiles" on profiles;
drop policy if exists "maj profiles" on profiles;
drop policy if exists "ecriture notes" on player_ratings;
drop policy if exists "maj notes" on player_ratings;
drop policy if exists "ecriture hdm" on motm_votes;
drop policy if exists "maj hdm" on motm_votes;
drop policy if exists "ecriture debats" on debate_votes;
drop policy if exists "maj debats" on debate_votes;
drop policy if exists "ecriture pronos" on predictions;
drop policy if exists "maj pronos" on predictions;

create policy "ecriture profiles" on profiles
  for insert with check (auth.uid() = id);
create policy "maj profiles" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "ecriture notes" on player_ratings
  for insert with check (auth.uid() = user_id);
create policy "maj notes" on player_ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ecriture hdm" on motm_votes
  for insert with check (auth.uid() = user_id);
create policy "maj hdm" on motm_votes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ecriture debats" on debate_votes
  for insert with check (auth.uid() = user_id);
create policy "maj debats" on debate_votes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ecriture pronos" on predictions
  for insert with check (auth.uid() = user_id);
create policy "maj pronos" on predictions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Droit à l'effacement (RGPD art. 17). Deux chemins mènent au même résultat :
-- supprimer le compte dans auth.users emporte tout par cascade, et le bouton
-- « Supprimer mon compte » de l'application efface table par table. Le second
-- a besoin de politiques de suppression explicites — sans elles, RLS refuse
-- silencieusement et l'utilisateur croit ses données parties.
drop policy if exists "suppression pronos" on predictions;
drop policy if exists "suppression notes" on player_ratings;
drop policy if exists "suppression hdm" on motm_votes;
drop policy if exists "suppression debats" on debate_votes;
drop policy if exists "suppression profil" on profiles;

create policy "suppression pronos" on predictions
  for delete using (auth.uid() = user_id);
create policy "suppression notes" on player_ratings
  for delete using (auth.uid() = user_id);
create policy "suppression hdm" on motm_votes
  for delete using (auth.uid() = user_id);
create policy "suppression debats" on debate_votes
  for delete using (auth.uid() = user_id);
create policy "suppression profil" on profiles
  for delete using (auth.uid() = id);
