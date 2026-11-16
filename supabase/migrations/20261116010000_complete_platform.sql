-- دليل المعلنين: توسعة آمنة للبنية الحالية دون حذف أو إعادة إنشاء أي جدول.
-- نفّذ بعد أخذ نسخة احتياطية. جميع الجداول الجديدة محمية بـ RLS.

alter table public.advertisers
  add column if not exists neighborhood text,
  add column if not exists gender text,
  add column if not exists profile_url text,
  add column if not exists instagram_url text,
  add column if not exists snapchat_url text,
  add column if not exists tiktok_url text,
  add column if not exists youtube_url text,
  add column if not exists x_url text,
  add column if not exists price_attendance numeric(12,2),
  add column if not exists price_home numeric(12,2),
  add column if not exists price_hospitality numeric(12,2),
  add column if not exists price_free boolean not null default false;

create index if not exists advertisers_region_city_idx on public.advertisers(region_slug, city);
create index if not exists advertisers_followers_idx on public.advertisers(followers desc);
create index if not exists advertisers_deleted_at_idx on public.advertisers(deleted_at);

create table if not exists public.branches (
 id uuid primary key default gen_random_uuid(), name text not null, city text, address text,
 is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.campaigns (
 id uuid primary key default gen_random_uuid(), name text not null, client_name text, branch_id uuid references public.branches(id) on delete set null,
 status text not null default 'draft' check (status in ('draft','planned','active','completed','cancelled')),
 starts_on date, ends_on date, budget numeric(12,2), notes text, created_by uuid default auth.uid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.personal_lists (
 id uuid primary key default gen_random_uuid(), name text not null, owner_id uuid not null default auth.uid(),
 status text not null default 'draft' check (status in ('draft','submitted','approved','rejected')),
 branch_id uuid references public.branches(id) on delete set null, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.personal_list_items (
 id uuid primary key default gen_random_uuid(), list_id uuid not null references public.personal_lists(id) on delete cascade,
 advertiser_id uuid not null references public.advertisers(id) on delete cascade, created_at timestamptz not null default now(),
 unique(list_id, advertiser_id)
);
create table if not exists public.list_requests (
 id uuid primary key default gen_random_uuid(), list_id uuid not null references public.personal_lists(id) on delete cascade,
 submitted_by uuid not null default auth.uid(), status text not null default 'pending' check(status in ('pending','approved','rejected')),
 reviewer_id uuid, review_notes text, submitted_at timestamptz not null default now(), reviewed_at timestamptz
);
create table if not exists public.regions (
 slug text primary key, name_ar text not null, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.cities (
 id uuid primary key default gen_random_uuid(), region_slug text not null references public.regions(slug) on update cascade,
 name_ar text not null, is_active boolean not null default true, created_at timestamptz not null default now(), unique(region_slug,name_ar)
);
create table if not exists public.store_members (
 id uuid primary key default gen_random_uuid(), branch_id uuid not null references public.branches(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), unique(branch_id,user_id)
);

insert into public.regions(slug,name_ar) values
('riyadh','منطقة الرياض'),('makkah','منطقة مكة المكرمة'),('eastern','المنطقة الشرقية'),('madinah','منطقة المدينة المنورة'),
('qassim','منطقة القصيم'),('asir','منطقة عسير'),('tabuk','منطقة تبوك'),('hail','منطقة حائل'),('jazan','منطقة جازان'),
('najran','منطقة نجران'),('jouf','منطقة الجوف'),('northern-borders','منطقة الحدود الشمالية'),('baha','منطقة الباحة')
on conflict(slug) do update set name_ar=excluded.name_ar;

alter table public.branches enable row level security;
alter table public.campaigns enable row level security;
alter table public.personal_lists enable row level security;
alter table public.personal_list_items enable row level security;
alter table public.list_requests enable row level security;
alter table public.regions enable row level security;
alter table public.cities enable row level security;
alter table public.store_members enable row level security;

-- صلاحيات المنصة الحالية هي مصدر التفويض؛ لا نعتمد على بيانات user_metadata.
drop policy if exists branches_read on public.branches;
create policy branches_read on public.branches for select to authenticated using (public.is_active_user());
drop policy if exists branches_write on public.branches;
create policy branches_write on public.branches for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
drop policy if exists campaigns_read on public.campaigns;
create policy campaigns_read on public.campaigns for select to authenticated using (public.has_permission('campaigns.view') or public.has_permission('campaigns.manage'));
drop policy if exists campaigns_write on public.campaigns;
create policy campaigns_write on public.campaigns for all to authenticated using (public.has_permission('campaigns.manage')) with check (public.has_permission('campaigns.manage'));
drop policy if exists lists_read on public.personal_lists;
create policy lists_read on public.personal_lists for select to authenticated using (owner_id=(select auth.uid()) or public.has_permission('lists.review'));
drop policy if exists lists_insert on public.personal_lists;
create policy lists_insert on public.personal_lists for insert to authenticated with check (owner_id=(select auth.uid()) and public.has_permission('lists.own'));
drop policy if exists lists_update on public.personal_lists;
create policy lists_update on public.personal_lists for update to authenticated using ((owner_id=(select auth.uid()) and status='draft') or public.has_permission('lists.review')) with check ((owner_id=(select auth.uid()) and status in ('draft','submitted')) or public.has_permission('lists.review'));
drop policy if exists lists_delete on public.personal_lists;
create policy lists_delete on public.personal_lists for delete to authenticated using ((owner_id=(select auth.uid()) and status='draft') or public.has_permission('lists.review'));
drop policy if exists list_items_access on public.personal_list_items;
create policy list_items_access on public.personal_list_items for all to authenticated using (exists(select 1 from public.personal_lists l where l.id=list_id and (l.owner_id=(select auth.uid()) or public.has_permission('lists.review')))) with check (exists(select 1 from public.personal_lists l where l.id=list_id and l.owner_id=(select auth.uid()) and l.status='draft'));
drop policy if exists list_requests_read on public.list_requests;
create policy list_requests_read on public.list_requests for select to authenticated using (submitted_by=(select auth.uid()) or public.has_permission('lists.review'));
drop policy if exists list_requests_insert on public.list_requests;
create policy list_requests_insert on public.list_requests for insert to authenticated with check (submitted_by=(select auth.uid()) and public.has_permission('lists.own'));
drop policy if exists list_requests_review on public.list_requests;
create policy list_requests_review on public.list_requests for update to authenticated using (public.has_permission('lists.review')) with check (public.has_permission('lists.review'));
drop policy if exists regions_read on public.regions;
create policy regions_read on public.regions for select to authenticated using (public.is_active_user());
drop policy if exists regions_write on public.regions;
create policy regions_write on public.regions for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
drop policy if exists cities_read on public.cities;
create policy cities_read on public.cities for select to authenticated using (public.is_active_user());
drop policy if exists cities_write on public.cities;
create policy cities_write on public.cities for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
drop policy if exists store_members_read on public.store_members;
create policy store_members_read on public.store_members for select to authenticated using (user_id=(select auth.uid()) or public.has_permission('users.manage'));
drop policy if exists store_members_write on public.store_members;
create policy store_members_write on public.store_members for all to authenticated using (public.has_permission('users.manage')) with check (public.has_permission('users.manage'));

-- مفاتيح الصلاحيات الجديدة: لا تُمنح تلقائياً؛ يعيّنها مدير الأدوار حسب سياسة المنشأة.
insert into public.permissions(key,description_ar) values
('branches.manage','إدارة الفروع'),('regions.manage','إدارة المناطق والمدن')
on conflict(key) do nothing;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end; $$;
drop trigger if exists campaigns_touch_updated_at on public.campaigns;
create trigger campaigns_touch_updated_at before update on public.campaigns for each row execute function public.touch_updated_at();
drop trigger if exists lists_touch_updated_at on public.personal_lists;
create trigger lists_touch_updated_at before update on public.personal_lists for each row execute function public.touch_updated_at();
drop trigger if exists branches_touch_updated_at on public.branches;
create trigger branches_touch_updated_at before update on public.branches for each row execute function public.touch_updated_at();

-- بيانات المدن الأولية للمناطق الثلاث عشرة.
insert into public.cities(region_slug,name_ar) values
('riyadh','شمال الرياض'),
('riyadh','جنوب الرياض'),
('riyadh','شرق الرياض'),
('riyadh','غرب الرياض'),
('riyadh','وسط الرياض'),
('riyadh','الخرج'),
('riyadh','الدرعية'),
('riyadh','المجمعة'),
('riyadh','الدوادمي'),
('riyadh','الزلفي'),
('riyadh','وادي الدواسر'),
('riyadh','عفيف'),
('makkah','مكة المكرمة'),
('makkah','جدة'),
('makkah','الطائف'),
('makkah','رابغ'),
('makkah','القنفذة'),
('makkah','الليث'),
('makkah','الجموم'),
('eastern','الدمام'),
('eastern','الخبر'),
('eastern','الظهران'),
('eastern','الأحساء'),
('eastern','الجبيل'),
('eastern','القطيف'),
('eastern','حفر الباطن'),
('eastern','الخفجي'),
('madinah','المدينة المنورة'),
('madinah','ينبع'),
('madinah','العلا'),
('madinah','بدر'),
('madinah','خيبر'),
('madinah','المهد'),
('qassim','بريدة'),
('qassim','عنيزة'),
('qassim','الرس'),
('qassim','البكيرية'),
('qassim','المذنب'),
('qassim','البدائع'),
('asir','أبها'),
('asir','خميس مشيط'),
('asir','بيشة'),
('asir','النماص'),
('asir','محايل عسير'),
('asir','سراة عبيدة'),
('tabuk','تبوك'),
('tabuk','الوجه'),
('tabuk','ضباء'),
('tabuk','تيماء'),
('tabuk','أملج'),
('tabuk','حقل'),
('hail','حائل'),
('hail','بقعاء'),
('hail','الغزالة'),
('hail','الشنان'),
('jazan','جازان'),
('jazan','صبيا'),
('jazan','أبو عريش'),
('jazan','صامطة'),
('jazan','فرسان'),
('jazan','بيش'),
('najran','نجران'),
('najran','شرورة'),
('najran','حبونا'),
('najran','بدر الجنوب'),
('jouf','سكاكا'),
('jouf','دومة الجندل'),
('jouf','القريات'),
('jouf','طبرجل'),
('northern-borders','عرعر'),
('northern-borders','رفحاء'),
('northern-borders','طريف'),
('northern-borders','العويقيلة'),
('baha','الباحة'),
('baha','بلجرشي'),
('baha','المندق'),
('baha','المخواة'),
('baha','قلوة')
on conflict(region_slug,name_ar) do nothing;

-- ربط الحملة بالمعلنين مع حفظ سعر المعلن وقت التعاقد.
create table if not exists public.campaign_advertisers (
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campaigns(id) on delete cascade,
 advertiser_id uuid not null references public.advertisers(id) on delete restrict,
 agreed_price numeric(12,2), notes text, created_at timestamptz not null default now(), unique(campaign_id,advertiser_id)
);
alter table public.campaign_advertisers enable row level security;
drop policy if exists campaign_advertisers_read on public.campaign_advertisers;
create policy campaign_advertisers_read on public.campaign_advertisers for select to authenticated using (public.has_permission('campaigns.view') or public.has_permission('campaigns.manage'));
drop policy if exists campaign_advertisers_write on public.campaign_advertisers;
create policy campaign_advertisers_write on public.campaign_advertisers for all to authenticated using (public.has_permission('campaigns.manage')) with check (public.has_permission('campaigns.manage'));

-- سجل تدقيق تلقائي للمعلن دون السماح للعميل بكتابة السجل مباشرة.
create or replace function public.audit_advertiser_change() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if tg_op='INSERT' then
   insert into public.audit_logs(actor_id,action,table_name,record_id,new_data) values(auth.uid(),'insert','advertisers',new.id::text,to_jsonb(new)); return new;
 elsif tg_op='UPDATE' then
   insert into public.audit_logs(actor_id,action,table_name,record_id,old_data,new_data) values(auth.uid(),'update','advertisers',new.id::text,to_jsonb(old),to_jsonb(new)); return new;
 else
   insert into public.audit_logs(actor_id,action,table_name,record_id,old_data) values(auth.uid(),'delete','advertisers',old.id::text,to_jsonb(old)); return old;
 end if;
end; $$;
revoke all on function public.audit_advertiser_change() from public, anon, authenticated;
drop trigger if exists advertisers_audit_trigger on public.advertisers;
create trigger advertisers_audit_trigger after insert or update or delete on public.advertisers for each row execute function public.audit_advertiser_change();

-- عزل سجلات المعلنين والحملات حسب الفرع عند تعيين الفرع؛ السجلات غير المرتبطة بفرع مشتركة.
alter table public.advertisers add column if not exists branch_id uuid references public.branches(id) on delete set null;
create index if not exists advertisers_branch_idx on public.advertisers(branch_id);
create or replace function public.has_branch_access(target_branch uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select target_branch is null or exists(select 1 from public.store_members sm where sm.branch_id=target_branch and sm.user_id=(select auth.uid()))
$$;
revoke all on function public.has_branch_access(uuid) from public, anon;
grant execute on function public.has_branch_access(uuid) to authenticated;

drop policy if exists advertisers_select on public.advertisers;
create policy advertisers_select on public.advertisers for select to authenticated using (
 ((public.has_permission('advertisers.view') and deleted_at is null) or public.has_permission('trash.manage')) and public.has_branch_access(branch_id)
);
drop policy if exists advertisers_insert on public.advertisers;
create policy advertisers_insert on public.advertisers for insert to authenticated with check (
 public.has_permission('advertisers.edit') and public.has_branch_access(branch_id)
);
drop policy if exists advertisers_update on public.advertisers;
create policy advertisers_update on public.advertisers for update to authenticated using (
 ((public.has_permission('advertisers.edit') and deleted_at is null) or public.has_permission('trash.manage')) and public.has_branch_access(branch_id)
) with check (
 (public.has_permission('advertisers.edit') or public.has_permission('trash.manage')) and public.has_branch_access(branch_id)
);
drop policy if exists advertisers_delete on public.advertisers;
create policy advertisers_delete on public.advertisers for delete to authenticated using (
 public.has_permission('trash.manage') and public.has_branch_access(branch_id)
);

-- ربط عرض الهاتف والملاحظات الخاصة بصلاحية المعلومة وبفرع المعلن معاً.
drop policy if exists advertiser_phones_all on public.advertiser_phones;
create policy advertiser_phones_all on public.advertiser_phones for all to authenticated using (
 public.has_permission('advertisers.view_phone') and exists(select 1 from public.advertisers a where a.id=advertiser_id and public.has_branch_access(a.branch_id))
) with check (
 public.has_permission('advertisers.view_phone') and exists(select 1 from public.advertisers a where a.id=advertiser_id and public.has_branch_access(a.branch_id))
);
drop policy if exists advertiser_notes_all on public.advertiser_admin_notes;
create policy advertiser_notes_all on public.advertiser_admin_notes for all to authenticated using (
 public.has_permission('advertisers.view_notes') and exists(select 1 from public.advertisers a where a.id=advertiser_id and public.has_branch_access(a.branch_id))
) with check (
 public.has_permission('advertisers.view_notes') and exists(select 1 from public.advertisers a where a.id=advertiser_id and public.has_branch_access(a.branch_id))
);

-- تقييد الحملات والقوائم بفرع المستخدم عند ربطها بفرع محدد.
drop policy if exists campaigns_read on public.campaigns;
create policy campaigns_read on public.campaigns for select to authenticated using (
 (public.has_permission('campaigns.view') or public.has_permission('campaigns.manage')) and public.has_branch_access(branch_id)
);
drop policy if exists campaigns_write on public.campaigns;
create policy campaigns_write on public.campaigns for all to authenticated using (
 public.has_permission('campaigns.manage') and public.has_branch_access(branch_id)
) with check (public.has_permission('campaigns.manage') and public.has_branch_access(branch_id));
drop policy if exists lists_read on public.personal_lists;
create policy lists_read on public.personal_lists for select to authenticated using (
 (owner_id=(select auth.uid()) or public.has_permission('lists.review')) and public.has_branch_access(branch_id)
);
drop policy if exists lists_insert on public.personal_lists;
create policy lists_insert on public.personal_lists for insert to authenticated with check (
 owner_id=(select auth.uid()) and public.has_permission('lists.own') and public.has_branch_access(branch_id)
);
drop policy if exists lists_update on public.personal_lists;
create policy lists_update on public.personal_lists for update to authenticated using (
 ((owner_id=(select auth.uid()) and status='draft') or public.has_permission('lists.review')) and public.has_branch_access(branch_id)
) with check (
 ((owner_id=(select auth.uid()) and status in ('draft','submitted')) or public.has_permission('lists.review')) and public.has_branch_access(branch_id)
);
drop policy if exists lists_delete on public.personal_lists;
create policy lists_delete on public.personal_lists for delete to authenticated using (
 ((owner_id=(select auth.uid()) and status='draft') or public.has_permission('lists.review')) and public.has_branch_access(branch_id)
);

-- منع التصعيد الذاتي للصلاحيات: منح صلاحيات إدارة الأدوار/المستخدمين العليا محصور بمدير النظام.
create or replace function public.is_system_admin() returns boolean
language sql stable security invoker set search_path=public as $$
 select exists(select 1 from public.profiles p join public.roles r on r.id=p.role_id where p.id=(select auth.uid()) and p.is_active and r.key='admin')
$$;
revoke all on function public.is_system_admin() from public, anon;
grant execute on function public.is_system_admin() to authenticated;

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (
 public.has_permission('users.manage') and (id <> (select auth.uid()) or public.is_system_admin())
) with check (
 public.has_permission('users.manage') and (public.is_system_admin() or (
   id <> (select auth.uid()) and role_id <> (select id from public.roles where key='admin' limit 1)
 ))
);
drop policy if exists roles_write on public.roles;
create policy roles_write on public.roles for all to authenticated using (
 public.has_permission('roles.manage') and (not is_system or public.is_system_admin())
) with check (
 public.has_permission('roles.manage') and (not is_system or public.is_system_admin())
);
drop policy if exists role_permissions_write on public.role_permissions;
create policy role_permissions_write on public.role_permissions for all to authenticated using (
 public.has_permission('roles.manage') and exists(select 1 from public.roles r where r.id=role_id and (not r.is_system or public.is_system_admin()))
) with check (
 public.has_permission('roles.manage') and exists(select 1 from public.roles r where r.id=role_id and (not r.is_system or public.is_system_admin()))
 and (permission_key not in ('roles.manage','users.manage') or public.is_system_admin())
);

-- ربط سجل المعلن بالحملة مع تحقق نطاق الفرع.
drop policy if exists campaign_advertisers_read on public.campaign_advertisers;
create policy campaign_advertisers_read on public.campaign_advertisers for select to authenticated using (
 (public.has_permission('campaigns.view') or public.has_permission('campaigns.manage')) and exists(select 1 from public.campaigns c where c.id=campaign_id and public.has_branch_access(c.branch_id))
);
drop policy if exists campaign_advertisers_write on public.campaign_advertisers;
create policy campaign_advertisers_write on public.campaign_advertisers for all to authenticated using (
 public.has_permission('campaigns.manage') and exists(select 1 from public.campaigns c where c.id=campaign_id and public.has_branch_access(c.branch_id))
) with check (
 public.has_permission('campaigns.manage') and exists(select 1 from public.campaigns c where c.id=campaign_id and public.has_branch_access(c.branch_id))
);

drop policy if exists invitations_all on public.invitations;
create policy invitations_all on public.invitations for all to authenticated using (
 public.has_permission('users.manage') and (public.is_system_admin() or role_id <> (select id from public.roles where key='admin' limit 1))
) with check (
 public.has_permission('users.manage') and (public.is_system_admin() or role_id <> (select id from public.roles where key='admin' limit 1))
);

drop policy if exists list_requests_read on public.list_requests;
create policy list_requests_read on public.list_requests for select to authenticated using (
 (submitted_by=(select auth.uid()) or public.has_permission('lists.review'))
 and exists(select 1 from public.personal_lists l where l.id=list_id and public.has_branch_access(l.branch_id))
);
drop policy if exists list_requests_insert on public.list_requests;
create policy list_requests_insert on public.list_requests for insert to authenticated with check (
 submitted_by=(select auth.uid()) and public.has_permission('lists.own')
 and exists(select 1 from public.personal_lists l where l.id=list_id and l.owner_id=(select auth.uid()) and public.has_branch_access(l.branch_id))
);
drop policy if exists list_requests_review on public.list_requests;
create policy list_requests_review on public.list_requests for update to authenticated using (
 public.has_permission('lists.review') and exists(select 1 from public.personal_lists l where l.id=list_id and public.has_branch_access(l.branch_id))
) with check (
 public.has_permission('lists.review') and exists(select 1 from public.personal_lists l where l.id=list_id and public.has_branch_access(l.branch_id))
);

-- إتاحة الوصول عبر Data API للمستخدمين المسجلين فقط؛ RLS أعلاه هو الذي يحدد الصفوف والصلاحيات.
grant select, insert, update, delete on public.branches, public.campaigns, public.personal_lists,
 public.personal_list_items, public.list_requests, public.regions, public.cities,
 public.store_members, public.campaign_advertisers to authenticated;
revoke all on public.branches, public.campaigns, public.personal_lists,
 public.personal_list_items, public.list_requests, public.regions, public.cities,
 public.store_members, public.campaign_advertisers from anon;
