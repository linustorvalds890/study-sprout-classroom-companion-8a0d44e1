CREATE TABLE public.admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.admin_emails TO authenticated;
GRANT ALL ON public.admin_emails TO service_role;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY "admins read admin list" ON public.admin_emails FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admins add admins" ON public.admin_emails FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admins remove admins" ON public.admin_emails FOR DELETE TO authenticated USING (public.is_admin());

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'book',
  instructor text NOT NULL DEFAULT '',
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  explanation text NOT NULL DEFAULT '',
  solutions jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_path text NOT NULL,
  mime_type text NOT NULL DEFAULT '',
  size_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  minutes int NOT NULL DEFAULT 10,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'class',
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'news',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects, public.lessons, public.materials, public.quizzes, public.events, public.announcements TO authenticated;
GRANT ALL ON public.subjects, public.lessons, public.materials, public.quizzes, public.events, public.announcements TO service_role;

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students read subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "students read lessons" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write lessons" ON public.lessons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "students read materials" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write materials" ON public.materials FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "students read quizzes" ON public.quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write quizzes" ON public.quizzes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "students read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write events" ON public.events FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "students read announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write announcements" ON public.announcements FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.announcement_reads (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);
GRANT SELECT, INSERT ON public.announcement_reads TO authenticated;
GRANT ALL ON public.announcement_reads TO service_role;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reads select" ON public.announcement_reads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own reads insert" ON public.announcement_reads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "students read material files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'materials');
CREATE POLICY "admins upload material files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'materials' AND public.is_admin());
CREATE POLICY "admins delete material files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'materials' AND public.is_admin());