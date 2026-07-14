-- ─── igot: schema do Supabase ─────────────────────────────────────────
-- Rode este script no SQL Editor do painel do Supabase.
-- Cria a tabela 'books' com Row Level Security (cada usuário só vê os seus).

-- Tabela principal: um livro por linha, com todo o estado de leitura.
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text,
  file_name text,
  file_size int default 0,
  source_format text,            -- 'epub' | 'pdf' | 'txt'
  book jsonb,                    -- ParsedBook serializado (texto estruturado)
  chapter_idx int default 0,
  zoom float default 1,
  translations jsonb default '{}',  -- mapa {pageNum: textoTraduzido}
  notes jsonb default '[]',         -- array de SavedNote
  saved_at bigint,               -- timestamp ms (last-write-wins no merge)
  created_at timestamptz default now()
);

-- Índices pra buscas por usuário (lista de livros).
create index if not exists books_user_id_idx on books(user_id);

-- ─── Row Level Security ──────────────────────────────────────────────
-- Garante que cada usuário só enxerga/modifica os PRÓPRIOS livros.
-- Mesmo com a anon key pública, ninguém consegue ler dados de outros.
alter table books enable row level security;

-- Política: todas as operações (select/insert/update/delete) só valem
-- quando a coluna user_id bate com o usuário logado (auth.uid()).
drop policy if exists "own books" on books;
create policy "own books" on books
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
