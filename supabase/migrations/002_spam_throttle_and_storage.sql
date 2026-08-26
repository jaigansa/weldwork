-- 002: Hardening — spam throttles and storage upload constraints.
-- Mirrors Section 1/2 of /supabase-setup.sql. Run once in SQL Editor.

-- Ratings: length limits + global 30s throttle
drop policy if exists "anon_insert_ratings" on public.ratings;
create policy "anon_insert_ratings"
  on public.ratings for insert
  to anon
  with check (
    char_length(coalesce(name, '')) <= 80
    and char_length(coalesce(message, '')) <= 1000
    and not exists (
      select 1 from public.ratings r
      where r.created_at > now() - interval '30 seconds'
    )
  );

-- Quotes: length constraints (idempotent)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'quotes_name_len') then
    alter table public.quotes add constraint quotes_name_len check (char_length(name) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quotes_phone_len') then
    alter table public.quotes add constraint quotes_phone_len check (char_length(phone) <= 20);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quotes_message_len') then
    alter table public.quotes add constraint quotes_message_len check (char_length(coalesce(message, '')) <= 2000);
  end if;
end $$;

-- Quotes: global 15s throttle
drop policy if exists "anon_insert_quotes" on public.quotes;
create policy "anon_insert_quotes"
  on public.quotes for insert
  to anon
  with check (
    not exists (
      select 1 from public.quotes q
      where q.created_at > now() - interval '15 seconds'
    )
  );

-- Storage: images only, inside quotes/, enforced server-side size cap.
drop policy if exists "anon_upload_quote_photos" on storage.objects;
create policy "anon_upload_quote_photos"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'quote-attachments'
    and (storage.foldername(name))[1] = 'quotes'
    and coalesce(metadata->>'mimetype', '') in ('image/jpeg', 'image/png', 'image/webp')
  );

create or replace function public.enforce_attachment_size()
returns trigger as $$
begin
  if new.bucket_id = 'quote-attachments'
     and coalesce((new.metadata->>'size')::bigint, 0) > 5 * 1024 * 1024 then
    raise exception 'Attachment exceeds 5MB limit';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_quote_attachment_size on storage.objects;
create trigger enforce_quote_attachment_size
  before insert on storage.objects
  for each row execute function public.enforce_attachment_size();
