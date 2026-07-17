create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.proposal_status as enum ('uploaded', 'queued', 'processing', 'completed', 'failed');
create type public.pipeline_run_status as enum ('queued', 'running', 'completed', 'failed', 'cancelled');
create type public.agent_state as enum ('idle', 'thinking', 'researching', 'translating', 'writing', 'completed', 'error');
create type public.agent_role as enum (
  'analyzer',
  'director',
  'rq_planner',
  'debater_a',
  'debater_b',
  'literature_researcher',
  'global_translator',
  'rq_validator',
  'academic_advisor',
  'main_writer'
);
create type public.rq_stage as enum ('initial', 'debated', 'validated', 'final');
create type public.debate_stance as enum ('support', 'critique');
create type public.paper_region as enum ('domestic', 'international');
create type public.final_paper_status as enum ('draft', 'reviewed', 'final');

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  mime_type text not null check (mime_type in (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  )),
  byte_size bigint not null check (byte_size between 1 and 20971520),
  storage_path text not null unique,
  extracted_content_ciphertext text,
  extracted_content_iv text,
  extracted_content_tag text,
  encryption_version smallint not null default 1 check (encryption_version = 1),
  status public.proposal_status not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposals_encrypted_content_complete check (
    (extracted_content_ciphertext is null and extracted_content_iv is null and extracted_content_tag is null)
    or
    (extracted_content_ciphertext is not null and extracted_content_iv is not null and extracted_content_tag is not null)
  )
);

create table public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status public.pipeline_run_status not null default 'queued',
  current_stage public.agent_role,
  progress smallint not null default 0 check (progress between 0 and 100),
  attempts smallint not null default 0 check (attempts between 0 and 10),
  available_at timestamptz not null default now(),
  claimed_by text,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_status (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  pipeline_run_id uuid not null references public.pipeline_runs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role public.agent_role not null,
  state public.agent_state not null default 'idle',
  progress smallint not null default 0 check (progress between 0 and 100),
  current_task text,
  heartbeat_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pipeline_run_id, role)
);

create table public.agent_events (
  id bigint generated always as identity primary key,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  pipeline_run_id uuid not null references public.pipeline_runs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role public.agent_role not null,
  state public.agent_state not null,
  message text not null check (char_length(message) between 1 and 8000),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.rq_records (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  pipeline_run_id uuid not null references public.pipeline_runs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  version integer not null check (version > 0),
  stage public.rq_stage not null,
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) > 0),
  rationale text not null,
  parent_id uuid references public.rq_records(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (proposal_id, version)
);

create table public.debate_logs (
  id bigint generated always as identity primary key,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  pipeline_run_id uuid not null references public.pipeline_runs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  round smallint not null check (round between 1 and 3),
  turn smallint not null check (turn between 1 and 6),
  speaker public.agent_role not null check (speaker in ('debater_a', 'debater_b')),
  stance public.debate_stance not null,
  content text not null check (char_length(content) between 1 and 12000),
  created_at timestamptz not null default now(),
  unique (pipeline_run_id, turn),
  constraint debate_turn_round_match check (round = ((turn - 1) / 2) + 1),
  constraint debate_speaker_stance_match check (
    (speaker = 'debater_a' and stance = 'support')
    or (speaker = 'debater_b' and stance = 'critique')
  )
);

create table public.research_papers (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  pipeline_run_id uuid not null references public.pipeline_runs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 1000),
  authors text[] not null default '{}',
  publication_year smallint check (publication_year between 1800 and 2200),
  journal text,
  doi text,
  url text,
  source_database text not null,
  region public.paper_region not null,
  language_code text not null default 'en' check (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  abstract_summary text,
  translated_summary text,
  relevance_score numeric(4,3) check (relevance_score between 0 and 1),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  constraint research_papers_locator check (doi is not null or url is not null)
);

create table public.advisor_feedbacks (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  pipeline_run_id uuid not null references public.pipeline_runs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  rubric jsonb not null default '{}'::jsonb check (jsonb_typeof(rubric) = 'object'),
  summary text not null,
  required_revisions jsonb not null default '[]'::jsonb check (jsonb_typeof(required_revisions) = 'array'),
  recommendation text not null,
  created_at timestamptz not null default now()
);

create table public.final_papers (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  pipeline_run_id uuid not null references public.pipeline_runs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  version integer not null check (version > 0),
  title text not null check (char_length(title) between 1 and 500),
  abstract text not null,
  body_ciphertext text not null,
  body_iv text not null,
  body_tag text not null,
  encryption_version smallint not null default 1 check (encryption_version = 1),
  status public.final_paper_status not null default 'draft',
  citation_style text not null default 'APA 7',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (proposal_id, version)
);

create table public.skill_registry (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  role public.agent_role not null,
  version text not null,
  source_url text not null,
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  prompt_template text not null,
  manifest jsonb not null default '{}'::jsonb check (jsonb_typeof(manifest) = 'object'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name, version)
);

create index proposals_owner_created_idx on public.proposals (owner_id, created_at desc);
create index pipeline_runs_proposal_idx on public.pipeline_runs (proposal_id);
create index pipeline_runs_owner_created_idx on public.pipeline_runs (owner_id, created_at desc);
create index pipeline_runs_pending_idx on public.pipeline_runs (available_at, created_at)
  where status = 'queued';
create index agent_status_proposal_idx on public.agent_status (proposal_id);
create index agent_status_owner_idx on public.agent_status (owner_id);
create index agent_status_run_updated_idx on public.agent_status (pipeline_run_id, updated_at desc);
create index agent_events_proposal_created_idx on public.agent_events (proposal_id, created_at desc, id desc);
create index agent_events_run_idx on public.agent_events (pipeline_run_id);
create index agent_events_owner_idx on public.agent_events (owner_id);
create index rq_records_run_idx on public.rq_records (pipeline_run_id);
create index rq_records_owner_idx on public.rq_records (owner_id);
create index rq_records_parent_idx on public.rq_records (parent_id);
create index debate_logs_proposal_created_idx on public.debate_logs (proposal_id, created_at desc, id desc);
create index debate_logs_run_idx on public.debate_logs (pipeline_run_id);
create index debate_logs_owner_idx on public.debate_logs (owner_id);
create index research_papers_proposal_score_idx on public.research_papers (proposal_id, relevance_score desc nulls last);
create index research_papers_run_idx on public.research_papers (pipeline_run_id);
create index research_papers_owner_idx on public.research_papers (owner_id);
create unique index research_papers_unique_locator_idx on public.research_papers (
  proposal_id,
  coalesce(lower(doi), ''),
  coalesce(url, '')
);
create index advisor_feedbacks_proposal_idx on public.advisor_feedbacks (proposal_id);
create index advisor_feedbacks_run_idx on public.advisor_feedbacks (pipeline_run_id);
create index advisor_feedbacks_owner_idx on public.advisor_feedbacks (owner_id);
create index final_papers_proposal_created_idx on public.final_papers (proposal_id, created_at desc);
create index final_papers_run_idx on public.final_papers (pipeline_run_id);
create index final_papers_owner_idx on public.final_papers (owner_id);
create index skill_registry_owner_enabled_idx on public.skill_registry (owner_id, enabled) where enabled;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger proposals_set_updated_at before update on public.proposals
for each row execute function private.set_updated_at();
create trigger pipeline_runs_set_updated_at before update on public.pipeline_runs
for each row execute function private.set_updated_at();
create trigger agent_status_set_updated_at before update on public.agent_status
for each row execute function private.set_updated_at();
create trigger final_papers_set_updated_at before update on public.final_papers
for each row execute function private.set_updated_at();
create trigger skill_registry_set_updated_at before update on public.skill_registry
for each row execute function private.set_updated_at();

create function private.claim_next_pipeline_run(worker_id text)
returns setof public.pipeline_runs
language sql
security definer
set search_path = ''
as $$
  with next_run as (
    select id
    from public.pipeline_runs
    where status = 'queued'
      and available_at <= now()
      and attempts < 10
    order by available_at, created_at
    for update skip locked
    limit 1
  )
  update public.pipeline_runs as run
  set status = 'running',
      claimed_by = worker_id,
      attempts = run.attempts + 1,
      started_at = coalesce(run.started_at, now()),
      error_message = null
  from next_run
  where run.id = next_run.id
  returning run.*;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.claim_next_pipeline_run(text) from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.claim_next_pipeline_run(text) to service_role;

alter table public.proposals enable row level security;
alter table public.pipeline_runs enable row level security;
alter table public.agent_status enable row level security;
alter table public.agent_events enable row level security;
alter table public.rq_records enable row level security;
alter table public.debate_logs enable row level security;
alter table public.research_papers enable row level security;
alter table public.advisor_feedbacks enable row level security;
alter table public.final_papers enable row level security;
alter table public.skill_registry enable row level security;

create policy "owners read proposals" on public.proposals for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "owners read pipeline runs" on public.pipeline_runs for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "owners read agent status" on public.agent_status for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "owners read agent events" on public.agent_events for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "owners read research questions" on public.rq_records for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "owners read debate logs" on public.debate_logs for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "owners read research papers" on public.research_papers for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "owners read advisor feedback" on public.advisor_feedbacks for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "owners read final papers" on public.final_papers for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "owners read skill registry" on public.skill_registry for select to authenticated
using ((select auth.uid()) = owner_id);

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.proposals, public.pipeline_runs, public.agent_status, public.agent_events,
  public.rq_records, public.debate_logs, public.research_papers, public.advisor_feedbacks,
  public.final_papers, public.skill_registry to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proposals',
  'proposals',
  false,
  20971520,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "owners read proposal files" on storage.objects for select to authenticated
using (bucket_id = 'proposals' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners upload proposal files" on storage.objects for insert to authenticated
with check (bucket_id = 'proposals' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners delete proposal files" on storage.objects for delete to authenticated
using (bucket_id = 'proposals' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter publication supabase_realtime add table
  public.pipeline_runs,
  public.agent_status,
  public.agent_events,
  public.rq_records,
  public.debate_logs,
  public.research_papers,
  public.advisor_feedbacks,
  public.final_papers;
