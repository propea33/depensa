-- ═══════════════════════════════════════════════════════
--  PROFILES — Trial + Subscription tracking
-- ═══════════════════════════════════════════════════════

create table if not exists public.profiles (
    id                   uuid references auth.users(id) on delete cascade primary key,
    trial_start_at       timestamptz not null default now(),
    stripe_customer_id   text unique,
    subscription_status  text not null default 'trial',  -- 'trial' | 'active' | 'expired'
    subscription_end_at  timestamptz,
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);

-- RLS : chaque utilisateur lit/modifie uniquement son propre profil
alter table public.profiles enable row level security;

create policy "Lecture propre profil"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Mise à jour propre profil"
    on public.profiles for update
    using (auth.uid() = id);

-- Auto-création du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, trial_start_at)
    values (new.id, now())
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
