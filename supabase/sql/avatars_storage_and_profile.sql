-- ============================================================
-- Paste this into Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
-- 1. Add avatar_path column to profiles (safe: IF NOT EXISTS)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_path text;
-- 2. Create private storage bucket "avatars"
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false) ON CONFLICT (id) DO NOTHING;
-- 3. Storage policies: users can only access their own folder (userId/*)
-- SELECT (read own avatars)
CREATE POLICY "Users can read own avatars" ON storage.objects FOR
SELECT USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- INSERT (upload own avatars)
CREATE POLICY "Users can upload own avatars" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- UPDATE (overwrite own avatars)
CREATE POLICY "Users can update own avatars" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- DELETE (remove own avatars)
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);