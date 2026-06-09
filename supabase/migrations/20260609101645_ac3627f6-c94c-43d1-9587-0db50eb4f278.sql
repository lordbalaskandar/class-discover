
-- Demo hosts
DO $$
DECLARE
  h1 uuid := '11111111-1111-1111-1111-111111111111';
  h2 uuid := '22222222-2222-2222-2222-222222222222';
  h3 uuid := '33333333-3333-3333-3333-333333333333';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES
    (h1, '00000000-0000-0000-0000-000000000000','authenticated','authenticated','demo-sasha@dryvon.app', crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Sasha Rivera"}', false,'','','',''),
    (h2, '00000000-0000-0000-0000-000000000000','authenticated','authenticated','demo-marcus@dryvon.app', crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Marcus Chen"}', false,'','','',''),
    (h3, '00000000-0000-0000-0000-000000000000','authenticated','authenticated','demo-elena@dryvon.app', crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Elena Park"}', false,'','','','')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, display_name, bio, city, avatar_url) VALUES
    (h1, 'Sasha Rivera', 'Certified pilates and barre instructor with 8 years of studio experience.', 'Brooklyn, NY', 'https://i.pravatar.cc/150?img=47'),
    (h2, 'Marcus Chen', 'Former amateur boxer running community-focused boxing fundamentals.', 'Austin, TX', 'https://i.pravatar.cc/150?img=12'),
    (h3, 'Elena Park', 'Vinyasa yoga teacher and rock climbing coach. Outdoor enthusiast.', 'Denver, CO', 'https://i.pravatar.cc/150?img=32')
  ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, bio = EXCLUDED.bio, city = EXCLUDED.city, avatar_url = EXCLUDED.avatar_url;

  INSERT INTO public.user_roles (user_id, role) VALUES
    (h1, 'host'), (h2, 'host'), (h3, 'host')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.classes (host_id, title, description, activity, location, image_url, duration_min, booking_type, start_at, capacity, is_active) VALUES
    (h1, 'Sunrise Reformer Pilates', 'Low-impact reformer flow to wake up your core and posture. All levels welcome.', 'Pilates', 'Williamsburg Studio, Brooklyn', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80', 50, 'scheduled', now() + interval '2 days' + interval '7 hours', 8, true),
    (h1, 'Barre Burn Express', 'Quick 45-min barre session targeting glutes, thighs and arms.', 'Barre', 'Williamsburg Studio, Brooklyn', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80', 45, 'scheduled', now() + interval '3 days' + interval '18 hours', 12, true),
    (h2, 'Boxing Fundamentals', 'Footwork, jabs, combos and pad work. Beginner-friendly.', 'Boxing', 'East Side Gym, Austin', 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200&q=80', 60, 'scheduled', now() + interval '1 day' + interval '19 hours', 10, true),
    (h2, 'Private Boxing Coaching', 'One-on-one session tailored to your goals. Book a time that works for you.', 'Boxing', 'East Side Gym, Austin', 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=1200&q=80', 60, 'on_request', NULL, NULL, true),
    (h2, 'Saturday Pickleball Open Play', 'Friendly doubles rotation. Paddles available to borrow.', 'Pickleball', 'Zilker Courts, Austin', 'https://images.unsplash.com/photo-1687202186773-9b8f44388b18?w=1200&q=80', 90, 'scheduled', now() + interval '5 days' + interval '10 hours', 16, true),
    (h3, 'Vinyasa Flow & Breathwork', 'Slow, intentional flow paired with guided breathwork to close out the week.', 'Yoga', 'Highlands Studio, Denver', 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80', 75, 'scheduled', now() + interval '4 days' + interval '17 hours 30 minutes', 14, true),
    (h3, 'Intro to Rock Climbing', 'Indoor top-rope intro covering knots, belaying basics and route reading.', 'Rock Climbing', 'Movement Climbing Gym, Denver', 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&q=80', 120, 'on_request', NULL, 4, true),
    (h1, 'HIIT & Core Blast', 'Bodyweight HIIT circuit with a focused core finisher. Bring a mat.', 'HIIT', 'Williamsburg Studio, Brooklyn', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80', 40, 'scheduled', now() + interval '2 days' + interval '12 hours', 15, true);
END $$;
