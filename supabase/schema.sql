-- 새벽이슬 말씀 캡슐 머신 — Supabase SQL Editor에서 한 번 실행
-- 다시 실행해도 안전하다(초기 데이터는 이미 있으면 건너뜀).

create table if not exists public.prizes (
  rank int primary key check (rank between 1 and 5),
  name text not null,
  stock int not null check (stock >= 0),
  initial_stock int not null check (initial_stock >= 0)
);

-- 정책을 두지 않아 브라우저용 키(anon/publishable)로는 읽기·쓰기 모두 불가.
-- 서버는 service role(secret) 키로 접근하므로 RLS를 우회한다.
alter table public.prizes enable row level security;

-- 프로젝트 기본 권한 설정과 상관없이 서버(service role)가 읽고 쓸 수 있게 명시한다.
grant select, insert, update on public.prizes to service_role;

-- 재고가 있을 때만 1 줄이고 성공 여부를 돌려준다(동시에 눌려도 음수로 내려가지 않음).
create or replace function public.take_prize(p_rank int)
returns boolean
language sql
as $$
  with u as (
    update public.prizes
       set stock = stock - 1
     where rank = p_rank and stock > 0
    returning 1
  )
  select exists(select 1 from u);
$$;

revoke execute on function public.take_prize(int) from public, anon, authenticated;
grant execute on function public.take_prize(int) to service_role;

insert into public.prizes (rank, name, stock, initial_stock) values
  (1, '기프트카드 1만원권', 7, 7),
  (2, '말랑이 or 그립톡', 21, 21),
  (3, '물병', 35, 35),
  (4, '파우치', 35, 35),
  (5, '키링', 35, 35)
on conflict (rank) do nothing;
