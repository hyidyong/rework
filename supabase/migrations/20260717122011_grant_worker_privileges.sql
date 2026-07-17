-- The worker uses a service-role JWT. RLS bypass does not imply SQL table privileges,
-- so grant only the application objects it must persist.
grant select, insert, update, delete on table
  public.proposals,
  public.pipeline_runs,
  public.agent_status,
  public.agent_events,
  public.rq_records,
  public.debate_logs,
  public.research_papers,
  public.advisor_feedbacks,
  public.final_papers,
  public.skill_registry
to service_role;

grant usage, select on all sequences in schema public to service_role;
