-- Initial schema: single `schools` table covering both primary (KS2) and
-- secondary (KS4) phases. See ROADMAP.md §2 for background.
--
-- Distance queries against `location` should always pass use_spheroid=false
-- to ST_DWithin/ST_Distance, matching the spherical (not spheroidal) Haversine
-- math already used in backend/app/spatial.py, the static frontend, and
-- regen_feeder.py -- otherwise static-vs-remote parity testing chases
-- meaningless sub-meter drift.
--
-- PK is (urn, phase), not urn alone -- URNs are NOT globally unique across
-- phases (confirmed against real data: URN 100171 appears in both the
-- primary and secondary datasets), despite an earlier assumption based on
-- a too-small sample of 2 records.

create extension if not exists postgis;

create table schools (
  urn               integer not null,
  name              text not null,
  postcode          text not null,
  latitude          double precision not null,
  longitude         double precision not null,
  location          geography(Point, 4326) not null,
  school_type       text,
  age_low           integer,
  age_high          integer,
  phase             text not null default 'primary' check (phase in ('primary', 'secondary')),
  performance_score numeric(5,1) not null,
  fsm_pct           numeric(5,1),

  -- KS2 (primary) metrics -- null for secondary rows
  ptrwm_exp         numeric(5,1),
  ptrwm_high        numeric(5,1),
  read_average      numeric(6,1),
  mat_average       numeric(6,1),
  gps_average       numeric(6,1),

  -- KS4 (secondary) metrics -- null for primary rows
  att8_score        numeric(5,1),
  l2basics_94       numeric(5,1),
  ebacc_94          numeric(5,1),
  ebacc_entry       numeric(5,1),

  street            text,
  town              text,
  locality          text,

  ethnicity         jsonb not null default '[]'::jsonb,
  feeder_secondary  jsonb,

  updated_at        timestamptz not null default now(),

  primary key (urn, phase)
);

-- Keep `location` in sync with latitude/longitude automatically so
-- scripts/load_to_postgres.py never has to build geography literals itself.
create or replace function schools_set_location() returns trigger as $$
begin
  new.location := ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326)::geography;
  return new;
end;
$$ language plpgsql;

create trigger schools_location_biu
  before insert or update of latitude, longitude on schools
  for each row execute function schools_set_location();

create index schools_location_gix on schools using gist (location);
create index schools_phase_idx on schools (phase);
create index schools_performance_idx on schools (performance_score desc);

-- Lightweight migration tracking (no Supabase CLI dependency -- see
-- backend/db/apply_migrations.py).
create table if not exists schema_migrations (
  filename    text primary key,
  applied_at  timestamptz not null default now()
);
