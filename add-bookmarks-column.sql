-- Adiciona a coluna 'bookmarks' na tabela 'books' do Supabase.
-- Roda isto no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/nsasbuqeeqdwsagpfpcc/sql/new

ALTER TABLE books
ADD COLUMN IF NOT EXISTS bookmarks JSONB DEFAULT '[]'::jsonb;
