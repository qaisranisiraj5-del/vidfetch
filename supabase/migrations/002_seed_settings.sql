-- ============================================================================
-- 002_seed_settings.sql — default app settings + integration status rows
-- ============================================================================
-- Run with: supabase db push   (after 001_core_schema.sql)
-- These are non-secret defaults; the admin can change them in /admin/settings.
-- ============================================================================

insert into public.app_settings (key, value) values
  ('site_name', '"VidFetch"'),
  ('site_tagline', '"Download videos from your favorite platforms — honestly."'),
  ('rate_limit_per_hour', '20'),
  ('enabled_platforms', '["youtube", "instagram", "facebook", "tiktok"]'),
  ('allowed_formats', '["mp4", "webm"]'),
  ('allowed_qualities', '["360p", "480p", "720p", "1080p"]'),
  ('contact_email', '"support@example.com"')
on conflict (key) do nothing;

insert into public.integration_status (platform, configured, healthy, message, last_checked_at) values
  ('youtube', false, false, 'Not configured — add YOUTUBE_API_KEY to enable.', now()),
  ('instagram', false, false, 'Not configured — add INSTAGRAM_ACCESS_TOKEN to enable.', now()),
  ('facebook', false, false, 'Not configured — add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to enable.', now()),
  ('tiktok', false, false, 'Not configured — add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET to enable.', now())
on conflict (platform) do nothing;
