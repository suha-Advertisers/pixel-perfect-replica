-- نفّذ بعد Migration للتأكد من وجود العناصر المطلوبة دون تعديل البيانات.
select 'advertisers columns' as check_name, count(*) as actual, 15 as minimum_expected
from information_schema.columns
where table_schema='public' and table_name='advertisers'
  and column_name in ('branch_id','neighborhood','gender','profile_url','instagram_url','snapchat_url','tiktok_url','youtube_url','x_url','price_attendance','price_home','price_hospitality','price_free','region_slug','city')
union all
select 'new tables', count(*), 8
from information_schema.tables
where table_schema='public' and table_name in ('branches','campaigns','personal_lists','personal_list_items','list_requests','regions','cities','store_members')
union all
select 'RLS enabled tables', count(*), 8
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('branches','campaigns','personal_lists','personal_list_items','list_requests','regions','cities','store_members') and c.relrowsecurity;

select tablename, policyname, cmd from pg_policies
where schemaname='public' and tablename in ('advertisers','advertiser_phones','advertiser_admin_notes','branches','campaigns','personal_lists','personal_list_items','list_requests','regions','cities','store_members','campaign_advertisers','profiles','roles','role_permissions','invitations')
order by tablename, policyname;

select slug, name_ar, count(c.id) as city_count
from public.regions r left join public.cities c on c.region_slug=r.slug
group by slug,name_ar order by name_ar;
