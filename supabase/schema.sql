-- Execute este script no SQL Editor do seu projeto Supabase.
-- Ele cria a tabela de perfis/assinaturas e mantem sincronizada com auth.users

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  subscription_status text not null default 'pending', -- pending | active | canceled | expired
  mercadopago_payment_id text,
  mercadopago_preapproval_id text,
  plan text default 'mensal',
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- cada usuario só pode ler/editar o proprio perfil
create policy "Usuarios podem ver o proprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuarios podem atualizar o proprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- cria automaticamente um perfil quando um novo usuario se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, subscription_status)
  values (new.id, new.email, 'pending')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- tabela simples para guardar roteiros gerados (opcional, mas util)
create table if not exists public.roteiros (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  titulo text,
  conteudo text,
  plataforma text,
  created_at timestamp with time zone default now()
);

alter table public.roteiros enable row level security;

create policy "Usuarios veem os proprios roteiros"
  on public.roteiros for select
  using (auth.uid() = user_id);

create policy "Usuarios criam os proprios roteiros"
  on public.roteiros for insert
  with check (auth.uid() = user_id);

create policy "Usuarios apagam os proprios roteiros"
  on public.roteiros for delete
  using (auth.uid() = user_id);

-- mensagens enviadas pelo formulario da pagina de Contato
create table if not exists public.mensagens_contato (
  id uuid default gen_random_uuid() primary key,
  nome text,
  email text,
  mensagem text not null,
  created_at timestamp with time zone default now()
);

alter table public.mensagens_contato enable row level security;

-- ninguem le/edita direto pelo navegador; somente a API do servidor
-- (que usa a service role key) grava novas mensagens.
create policy "Bloquear leitura publica"
  on public.mensagens_contato for select
  using (false);
