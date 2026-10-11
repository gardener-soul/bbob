-- 새벽이슬 말씀 캡슐 머신 — Supabase SQL Editor에서 실행
-- 처음 실행해도, 예전(팀 구분 없는) 스키마를 이미 실행한 프로젝트에서 다시 실행해도 된다.
-- 다시 실행해도 안전하다(초기 데이터는 이미 있으면 건너뜀).

-- 상품명: 등수별, 모든 팀 공통
create table if not exists public.prizes (
  rank int primary key check (rank between 1 and 5),
  name text not null
);

-- 예전 스키마에서 옮겨오기: 재고는 이제 팀별 테이블(team_stock)에 둔다
alter table public.prizes drop column if exists stock;
alter table public.prizes drop column if exists initial_stock;
update public.prizes set name = '볼펜' where rank = 3 and name = '물병';

-- 재고: 팀(1~7) × 등수(1~5)
create table if not exists public.team_stock (
  team int not null check (team between 1 and 7),
  rank int not null references public.prizes (rank),
  stock int not null check (stock >= 0),
  initial_stock int not null check (initial_stock >= 0),
  primary key (team, rank)
);

-- 정책을 두지 않아 브라우저용 키(anon/publishable)로는 읽기·쓰기 모두 불가.
-- 서버는 service role(secret) 키로 접근하므로 RLS를 우회한다.
alter table public.prizes enable row level security;
alter table public.team_stock enable row level security;

-- 프로젝트 기본 권한 설정과 상관없이 서버(service role)가 읽고 쓸 수 있게 명시한다.
grant select, insert, update on public.prizes to service_role;
grant select, insert, update on public.team_stock to service_role;

-- 그 팀 재고가 있을 때만 1 줄이고 성공 여부를 돌려준다(동시에 눌려도 음수로 내려가지 않음).
drop function if exists public.take_prize(int);
create or replace function public.take_prize(p_team int, p_rank int)
returns boolean
language sql
as $$
  with u as (
    update public.team_stock
       set stock = stock - 1
     where team = p_team and rank = p_rank and stock > 0
    returning 1
  )
  select exists(select 1 from u);
$$;

revoke execute on function public.take_prize(int, int) from public, anon, authenticated;
grant execute on function public.take_prize(int, int) to service_role;

insert into public.prizes (rank, name) values
  (1, '기프트카드 1만원권'),
  (2, '말랑이 or 그립톡'),
  (3, '볼펜'),
  (4, '파우치'),
  (5, '키링')
on conflict (rank) do nothing;

-- 팀당 1등 1 · 2등 4 · 3~5등 5 (7팀 합계 140)
insert into public.team_stock (team, rank, stock, initial_stock)
select t.team, q.rank, q.qty, q.qty
  from generate_series(1, 7) as t(team)
 cross join (values (1, 1), (2, 4), (3, 5), (4, 5), (5, 5)) as q(rank, qty)
on conflict (team, rank) do nothing;
