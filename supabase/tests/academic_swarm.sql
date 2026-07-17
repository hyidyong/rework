begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

select ok(to_regclass('public.proposals') is not null, 'proposals table exists');
select ok(to_regclass('public.pipeline_runs') is not null, 'pipeline_runs table exists');
select ok(to_regclass('public.agent_status') is not null, 'agent_status table exists');
select ok(to_regclass('public.agent_events') is not null, 'agent_events table exists');
select ok(to_regclass('public.rq_records') is not null, 'rq_records table exists');
select ok(to_regclass('public.debate_logs') is not null, 'debate_logs table exists');
select ok(to_regclass('public.research_papers') is not null, 'research_papers table exists');
select ok(to_regclass('public.advisor_feedbacks') is not null, 'advisor_feedbacks table exists');
select ok(to_regclass('public.final_papers') is not null, 'final_papers table exists');
select ok(to_regclass('public.skill_registry') is not null, 'skill_registry table exists');

select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'proposals',
        'pipeline_runs',
        'agent_status',
        'agent_events',
        'rq_records',
        'debate_logs',
        'research_papers',
        'advisor_feedbacks',
        'final_papers',
        'skill_registry'
      )
      and c.relrowsecurity
  ),
  10,
  'all application tables have RLS enabled'
);

select ok(
  (select count(*) >= 10 from pg_policies where schemaname = 'public'),
  'ownership policies exist'
);

select ok(
  to_regprocedure('private.claim_next_pipeline_run(text)') is not null,
  'atomic queue claim function exists'
);

select ok(
  exists(select 1 from storage.buckets where id = 'proposals' and not public),
  'private proposals bucket exists'
);

select ok(
  (
    select count(*) >= 7
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
  ),
  'realtime publication contains dashboard tables'
);

select ok(
  to_regclass('public.pipeline_runs_pending_idx') is not null,
  'pending queue has a partial index'
);

select * from finish();

rollback;
