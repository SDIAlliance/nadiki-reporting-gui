-- Create workloads table
create table if not exists public.workloads (
  id uuid default gen_random_uuid() primary key,
  server_id text not null,
  facility_id text not null,
  pod_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster lookups by server_id
create index if not exists workloads_server_id_idx on public.workloads (server_id);

-- Create index for faster lookups by facility_id
create index if not exists workloads_facility_id_idx on public.workloads (facility_id);

-- Create index for faster lookups by pod_name
create index if not exists workloads_pod_name_idx on public.workloads (pod_name);

-- Create a unique constraint to prevent duplicate workloads
create unique index if not exists workloads_unique_idx on public.workloads (server_id, facility_id, pod_name);

-- Enable Row Level Security
alter table public.workloads enable row level security;

-- Create a policy to allow all operations for now (adjust based on your auth requirements)
create policy "Allow all operations on workloads"
  on public.workloads
  for all
  using (true)
  with check (true);

-- Create a function to automatically update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create a trigger to automatically update updated_at
create trigger set_workloads_updated_at
  before update on public.workloads
  for each row
  execute function public.handle_updated_at();
