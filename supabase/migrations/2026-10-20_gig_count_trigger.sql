-- Keeps categories.gig_count equal to the number of ACTIVE gigs in each category.
-- Adds one function and one trigger. No existing table or column is changed.
-- Safe to run more than once.

CREATE OR REPLACE FUNCTION public.refresh_category_gig_count(cat_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.categories c
  SET gig_count = (
    SELECT COUNT(*)::INTEGER FROM public.gigs g
    WHERE g.category_id = c.id AND g.status = 'active'
  )
  WHERE c.id = cat_id;
$$;

CREATE OR REPLACE FUNCTION public.gigs_sync_category_gig_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.refresh_category_gig_count(NEW.category_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_category_gig_count(OLD.category_id);
  ELSE
    IF NEW.category_id IS DISTINCT FROM OLD.category_id THEN
      PERFORM public.refresh_category_gig_count(OLD.category_id);
      PERFORM public.refresh_category_gig_count(NEW.category_id);
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM public.refresh_category_gig_count(NEW.category_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS gigs_category_gig_count_trigger ON public.gigs;
CREATE TRIGGER gigs_category_gig_count_trigger
  AFTER INSERT OR DELETE OR UPDATE OF status, category_id ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.gigs_sync_category_gig_count();

-- One-time backfill: set every category to its true active-gig count.
UPDATE public.categories c
SET gig_count = (
  SELECT COUNT(*)::INTEGER FROM public.gigs g
  WHERE g.category_id = c.id AND g.status = 'active'
);
