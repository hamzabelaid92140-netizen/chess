-- =========================================================
-- VELTA — Schéma Supabase (commandes & suivi fournisseur)
-- À exécuter une fois dans : Supabase → SQL Editor → New query
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  stripe_payment_intent text,
  customer_email text not null,
  customer_name text,
  shipping_line1 text,
  shipping_line2 text,
  shipping_city text,
  shipping_postal_code text,
  shipping_country text,
  amount_total numeric(10,2) not null,
  amount_cost numeric(10,2) default 0,
  currency text not null default 'eur',
  status text not null default 'paid'
    check (status in ('paid', 'sent_to_supplier', 'shipped', 'cancelled')),
  cj_order_id text,
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  unit_cost numeric(10,2) default 0,
  quantity integer not null default 1,
  cj_pid text
);

create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);

-- Petite table clé/valeur : sert à mettre en cache le jeton d'accès
-- CJ Dropshipping (limité à une émission toutes les 5 minutes côté CJ)
-- entre deux invocations de la fonction serverless.
create table if not exists settings (
  key text primary key,
  value text,
  expires_at timestamptz
);
alter table settings enable row level security;

-- Sécurité : la clé "service role" utilisée par les fonctions /api
-- contourne RLS. On active RLS sans policy publique pour bloquer
-- tout accès direct depuis le navigateur avec la clé anonyme.
alter table orders enable row level security;
alter table order_items enable row level security;
