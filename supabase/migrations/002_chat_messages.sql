create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations text,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_document_id_created_at_idx
  on public.chat_messages (document_id, created_at);

alter table public.chat_messages enable row level security;
