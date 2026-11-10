DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT conname, conrelid::regclass AS tbl
           FROM pg_constraint
           WHERE contype = 'c' AND connamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
  END LOOP;
END $$;
