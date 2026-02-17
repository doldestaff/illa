-- ============================================================
-- FIX: MAKE AVATARS PUBLIC (For Leaderboard Visibility)
-- ============================================================
-- 1. Update the 'avatars' bucket to be public
-- This allows accessing images via the public URL format:
-- https://[project].supabase.co/storage/v1/object/public/avatars/[path]
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';
-- 2. Drop the restrictive "Users can read own avatars" policy
-- This policy prevented users from seeing other users' avatars.
DROP POLICY IF EXISTS "Users can read own avatars" ON storage.objects;
-- 3. Create a new policy allowing EVERYONE (anon + authenticated) to read avatars
CREATE POLICY "Public Read Access" ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
-- Note: Upload/Update/Delete policies remain unchanged (users can only edit their own).