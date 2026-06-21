-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tabel Kandang
create table public.kandang (
    id uuid default uuid_generate_v4() primary key,
    nama_kandang text not null,
    jenis_kandang text not null check (jenis_kandang in ('Indukan', 'Anak', 'Pejantan', 'Pembesaran')),
    kapasitas int not null default 0,
    qr_code_url text,
    user_email text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabel Babi
create table public.babi (
    id uuid default uuid_generate_v4() primary key,
    kandang_id uuid references public.kandang(id) on delete set null,
    kode_babi text not null unique,
    jenis_kelamin text not null check (jenis_kelamin in ('Jantan', 'Betina')),
    tanggal_lahir date not null,
    status_kesehatan text not null default 'Sehat' check (status_kesehatan in ('Sehat', 'Sakit Ringan', 'Sakit Sedang', 'Sakit Parah')),
    status_reproduksi text check (status_reproduksi in ('Belum Kawin', 'Bunting', 'Menyusui', 'Siap Kawin')),
    user_email text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabel Riwayat Kesehatan
create table public.kesehatan (
    id uuid default uuid_generate_v4() primary key,
    babi_id uuid references public.babi(id) on delete cascade not null,
    tanggal_sakit date not null default current_date,
    penyakit text not null,
    obat_diberikan text,
    catatan text,
    status text not null check (status in ('Ringan', 'Sedang', 'Parah', 'Sembuh')),
    user_email text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabel Vaksinasi
create table public.vaksinasi (
    id uuid default uuid_generate_v4() primary key,
    babi_id uuid references public.babi(id) on delete cascade not null,
    jenis_vaksin text not null,
    tanggal_vaksin date not null,
    tanggal_berikutnya date,
    catatan text,
    user_email text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabel Sanitasi Kandang
create table public.sanitasi (
    id uuid default uuid_generate_v4() primary key,
    kandang_id uuid references public.kandang(id) on delete cascade not null,
    tanggal_semprot date not null,
    jenis_disinfektan text not null,
    tanggal_berikutnya date,
    user_email text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Tabel Reproduksi
create table public.reproduksi (
    id uuid default uuid_generate_v4() primary key,
    babi_betina_id uuid references public.babi(id) on delete cascade not null,
    babi_jantan_id uuid references public.babi(id) on delete set null,
    tanggal_kawin date not null,
    status_bunting boolean default false,
    estimasi_lahir date,
    tanggal_melahirkan date,
    jumlah_anak_hidup int default 0,
    jumlah_anak_mati int default 0,
    user_email text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) Policies
-- Untuk tahap awal, kita aktifkan RLS tapi allow authenticated users full access
alter table public.kandang enable row level security;
alter table public.babi enable row level security;
alter table public.kesehatan enable row level security;
alter table public.vaksinasi enable row level security;
alter table public.sanitasi enable row level security;
alter table public.reproduksi enable row level security;

create policy "Tenant access kandang" on public.kandang for all
using (user_email = coalesce(auth.jwt() ->> 'email', ''))
with check (user_email = coalesce(auth.jwt() ->> 'email', ''));

create policy "Tenant access babi" on public.babi for all
using (user_email = coalesce(auth.jwt() ->> 'email', ''))
with check (user_email = coalesce(auth.jwt() ->> 'email', ''));

create policy "Tenant access kesehatan" on public.kesehatan for all
using (user_email = coalesce(auth.jwt() ->> 'email', ''))
with check (user_email = coalesce(auth.jwt() ->> 'email', ''));

create policy "Tenant access vaksinasi" on public.vaksinasi for all
using (user_email = coalesce(auth.jwt() ->> 'email', ''))
with check (user_email = coalesce(auth.jwt() ->> 'email', ''));

create policy "Tenant access sanitasi" on public.sanitasi for all
using (user_email = coalesce(auth.jwt() ->> 'email', ''))
with check (user_email = coalesce(auth.jwt() ->> 'email', ''));

create policy "Tenant access reproduksi" on public.reproduksi for all
using (user_email = coalesce(auth.jwt() ->> 'email', ''))
with check (user_email = coalesce(auth.jwt() ->> 'email', ''));
