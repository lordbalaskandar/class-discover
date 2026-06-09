CREATE TYPE public.listing_type AS ENUM ('class', 'trainer');
ALTER TABLE public.classes ADD COLUMN listing_type public.listing_type NOT NULL DEFAULT 'class';
CREATE INDEX classes_listing_type_idx ON public.classes(listing_type);