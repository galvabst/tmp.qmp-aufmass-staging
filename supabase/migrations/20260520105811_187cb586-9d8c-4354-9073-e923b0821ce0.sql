
UPDATE public.profiles
SET email = 'phoenix.energieberatung@gmail.com'
WHERE id = '2c05c58d-2881-4b3d-b51f-e42b772519f4';

UPDATE auth.users
SET email = 'phoenix.energieberatung@gmail.com',
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('email', 'phoenix.energieberatung@gmail.com'),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE id = '2c05c58d-2881-4b3d-b51f-e42b772519f4';

UPDATE auth.identities
SET identity_data = identity_data || jsonb_build_object('email', 'phoenix.energieberatung@gmail.com'),
    updated_at = now()
WHERE user_id = '2c05c58d-2881-4b3d-b51f-e42b772519f4'
  AND provider = 'email';
