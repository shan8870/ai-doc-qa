-- Enable pgvector for embedding search
create extension if not exists vector;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  page_count integer not null,
  full_text text not null,
  preview text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_document_id_idx
  on public.document_chunks (document_id);

alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

create or replace function public.match_document_chunks (
  p_document_id uuid,
  p_query_embedding vector(768),
  p_match_count integer default 5
)
returns table (
  chunk_index integer,
  content text,
  similarity double precision
)
language sql
stable
as $$
  select
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <=> p_query_embedding) as similarity
  from public.document_chunks dc
  where dc.document_id = p_document_id
  order by dc.embedding <=> p_query_embedding
  limit p_match_count;
$$;
