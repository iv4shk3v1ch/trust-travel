Here's everything about the database : schema, content
These things must be used for developing the app. I created standart notation and i'm gonna use it consistent across all the pages of my app. I want everything to be consistend as it designed by me. So when developing new feature thre must be:
1. check what are the acceptable values for the variables and make them in the iterface of my app. If it says budget "low (0-10), mid (10-25) and high (25+)" then it is only like that with these values
2. check if it has certain icon for displaying it. for example if i say "restaurant 🍽️ " then it can't be any other emoji related to restaurant

this is the database schema:
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.experience_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  category character varying NOT NULL,
  icon character varying,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT experience_tags_pkey PRIMARY KEY (id)
);
CREATE TABLE public.place_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  description text,
  icon character varying,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT place_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.places (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  place_type_id uuid NOT NULL,
  city text,
  country text DEFAULT 'Italy'::text,
  address text,
  latitude numeric,
  longitude numeric,
  phone character varying,
  website character varying,
  working_hours text,
  description text,
  photo_urls ARRAY,
  price_level text CHECK (price_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  indoor_outdoor text DEFAULT 'mixed'::text CHECK (indoor_outdoor = ANY (ARRAY['indoor'::text, 'outdoor'::text, 'mixed'::text])),
  avg_rating numeric DEFAULT 0.0,
  review_count integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  content_embedding USER-DEFINED,
  embedding_model character varying,
  embedding_updated_at timestamp with time zone,
  CONSTRAINT places_pkey PRIMARY KEY (id),
  CONSTRAINT places_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT places_place_type_fkey FOREIGN KEY (place_type_id) REFERENCES public.place_types(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  age integer CHECK (age >= 18 AND age <= 100),
  gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'non-binary'::text, 'prefer-not-to-say'::text])),
  updated_at timestamp with time zone DEFAULT now(),
  preference_embedding USER-DEFINED,
  embedding_model character varying,
  embedding_updated_at timestamp with time zone,
  budget text NOT NULL DEFAULT 'medium'::text,
  env_preference text DEFAULT 'balanced'::text,
  activity_style text DEFAULT 'balanced'::text,
  food_restrictions text DEFAULT ''::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.review_experience_tags (
  review_id uuid NOT NULL,
  experience_tag_id uuid NOT NULL,
  sentiment_score double precision DEFAULT 0.5 CHECK (sentiment_score >= 0::double precision AND sentiment_score <= 1::double precision),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_experience_tags_pkey PRIMARY KEY (review_id, experience_tag_id),
  CONSTRAINT review_experience_tags_review_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id),
  CONSTRAINT review_experience_tags_tag_fkey FOREIGN KEY (experience_tag_id) REFERENCES public.experience_tags(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_id uuid NOT NULL,
  comment text,
  visit_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  review_embedding USER-DEFINED,
  embedding_model character varying,
  embedding_updated_at timestamp with time zone,
  overall_rating numeric CHECK (overall_rating >= 0::numeric AND overall_rating <= 5::numeric),
  price_range text,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT reviews_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id)
);
CREATE TABLE public.trust_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_user uuid,
  target_user uuid,
  trust_level integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT trust_links_pkey PRIMARY KEY (id),
  CONSTRAINT trust_links_source_user_fkey FOREIGN KEY (source_user) REFERENCES auth.users(id),
  CONSTRAINT trust_links_target_user_fkey FOREIGN KEY (target_user) REFERENCES auth.users(id),
  CONSTRAINT trust_links_source_fkey FOREIGN KEY (source_user) REFERENCES auth.users(id),
  CONSTRAINT trust_links_target_fkey FOREIGN KEY (target_user) REFERENCES auth.users(id)
);
CREATE TABLE public.user_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  place_id uuid,
  action_type text CHECK (action_type = ANY (ARRAY['view'::text, 'save'::text, 'click'::text])),
  session_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT user_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT user_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_place_preferences (
  user_id uuid NOT NULL,
  place_type_id uuid NOT NULL,
  preference_strength double precision DEFAULT 1.0 CHECK (preference_strength >= 0::double precision AND preference_strength <= 1::double precision),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_place_preferences_pkey PRIMARY KEY (user_id, place_type_id),
  CONSTRAINT user_place_preferences_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_place_preferences_place_type_fkey FOREIGN KEY (place_type_id) REFERENCES public.place_types(id)
);



and here are the tables and what they store:

expierence tags

INSERT INTO "public"."experience_tags" ("id", "name", "slug", "category", "icon", "description", "created_at") VALUES ('05757779-82c9-41d2-a75a-0e574b676b03', 'Luxury', 'luxury', 'budget', null, null, '2025-11-07 16:51:48.928342+00'), ('461fb6e4-5ef2-4477-a35a-a3277cdeb342', 'Budget Friendly', 'budget-friendly', 'budget', null, null, '2025-11-07 16:51:48.928342+00'), ('0c13be77-b12f-496a-82fe-9e640395b217', 'Halal', 'halal', 'food/drink', null, null, '2025-11-07 16:51:48.928342+00'), ('941369c1-0c5b-467a-9bb4-8f378ee8ecf6', 'Vegeterian', 'vegeterian', 'food/drink', null, null, '2025-11-07 16:51:48.928342+00'), ('ef35658b-9683-496b-9c6c-b08557efd65c', 'Gluten-free', 'gluten-free', 'food/drink', null, null, '2025-11-07 16:51:48.928342+00'), ('2ce99f0d-54b2-486b-809a-d05d59cdddc0', 'Great Drinks', 'great-drinks', 'food/drink', null, null, '2025-11-07 16:51:48.928342+00'), ('4bc67974-ff87-4930-b2fc-2eb5ced8927c', 'Great Food', 'great-food', 'food/drink', null, null, '2025-11-07 16:51:48.928342+00'), ('14146215-d8e3-4601-ac17-7bb8b12cae6a', 'Vegan', 'vegan', 'food/drink', null, null, '2025-11-07 16:51:48.928342+00'), ('a0616a62-0c54-4781-9a87-5990c71f1791', 'Date Spot', 'date-spot', 'occasion', null, null, '2025-11-07 16:51:48.928342+00'), ('49690337-1a8d-46e5-95e9-5cce3f5992c9', 'Great for Daytime', 'great-for-daytime', 'occasion', null, null, '2025-11-07 16:51:48.928342+00'), ('3ae6c24c-bffc-4f3d-ba04-e0552af30c69', 'Best at Night', 'best-at-night', 'occasion', null, null, '2025-11-07 16:51:48.928342+00'), ('599fd924-bd1b-4301-b15e-9e5f4f0cdfbc', 'Rainy Day Spot', 'rainy-day-spot', 'occasion', null, null, '2025-11-07 16:51:48.928342+00'), ('1ef4cfe2-26bd-4132-a8d2-9bc33264b569', 'Quick Service', 'quick-service', 'service', null, null, '2025-11-07 16:51:48.928342+00'), ('bb527e4f-c375-47f7-8fd4-44f99da57fb6', 'Friendly Staff', 'friendly-staff', 'service', null, null, '2025-11-07 16:51:48.928342+00'), ('5e03d7e1-c701-41c5-a2fc-38a4a4552549', 'Local Favorite', 'local-favorite', 'social context', null, null, '2025-11-07 16:51:48.928342+00'), ('30e97cb4-d520-4c4a-be62-e454779c4904', 'DJ', 'dj', 'social context', null, null, '2025-11-07 16:51:48.928342+00'), ('2927c8b0-0e27-4f63-ad77-c27e4bad2222', 'Family Friendly', 'family-friendly', 'social context', null, null, '2025-11-07 16:51:48.928342+00'), ('1c9c16d9-1f5e-4185-af4b-0a30a308e9ca', 'Pet Friendly', 'pet-friendly', 'social context', null, null, '2025-11-07 16:51:48.928342+00'), ('00878ed5-fe2a-4c1b-a615-4dd6ed1125d9', 'Touristy', 'touristy', 'social context', null, null, '2025-11-07 16:51:48.928342+00'), ('251de26a-c85a-4d56-a39d-95cd1c5f7397', 'Solo Friendly', 'solo-friendly', 'social context', null, null, '2025-11-07 16:51:48.928342+00'), ('6a16ec5b-84ce-47fa-9120-f7688dd3213c', 'Perfect for Couples', 'perfect-for-couples', 'social context', null, null, '2025-11-07 16:51:48.928342+00'), ('eeb3ec8b-627d-4391-953f-7f580ee422a4', 'Student Crowd', 'student-crowd', 'social context', null, null, '2025-11-07 16:51:48.928342+00'), ('eb121a6b-51fc-4bb3-9d67-4edb5d8cd3d3', 'Great for Friends', 'great-for-friends', 'social context', null, null, '2025-11-07 16:51:48.928342+00'), ('c78ed2d4-7e32-4e4d-a24a-1de02336ec97', 'Cozy', 'cozy', 'vibe', null, null, '2025-11-07 16:51:48.928342+00'), ('01ca3914-dbc3-44cb-aa3f-ff243b5a908b', 'Elegant', 'elegant', 'vibe', null, null, '2025-11-07 16:51:48.928342+00'), ('62b266e1-27fb-462b-980f-33e99d26b2a6', 'Simple', 'simple', 'vibe', null, null, '2025-11-07 16:51:48.928342+00'), ('2c339489-59fb-48c4-a11f-4a2459f081a8', 'Romantic', 'romantic', 'vibe', null, null, '2025-11-07 16:51:48.928342+00'), ('5ee4de99-ae0a-4684-9184-d71de20260ee', 'Live Music', 'live-music', 'vibe', null, null, '2025-11-07 16:51:48.928342+00'), ('f2d8cb9a-0335-4442-a6ba-feaeeffed75b', 'Scenic View', 'scenic-view', 'vibe', null, null, '2025-11-07 16:51:48.928342+00'), ('1011ae33-9190-4c27-942f-cda2dfe5292f', 'Trendy', 'trendy', 'vibe', null, null, '2025-11-07 16:51:48.928342+00'), ('2a98b4a4-7833-446a-a0ec-53be8b8367fe', 'Authentic Local', 'authentic-local', 'vibe', null, null, '2025-11-07 16:51:48.928342+00'), ('4cacfdbe-13ea-4974-abb7-f98ec4e37e04', 'Peaceful', 'peaceful', 'vibe', null, null, '2025-11-07 16:51:48.928342+00'), ('bd34ea64-af7e-4c5f-8bf7-7e041fa03dcd', 'Lively', 'lively', 'vibe', null, null, '2025-11-07 16:51:48.928342+00'), ('d541e3e9-ba78-49ab-9adc-a8cd3b374286', 'Hidden Gem', 'hidden-gem', 'vibe', null, null, '2025-11-07 16:51:48.928342+00'), ('e4089962-429f-4797-af51-88ffb37fc0e6', 'Artsy', 'artsy', 'vibe', null, null, '2025-11-07 16:51:48.928342+00');

places_types

INSERT INTO "public"."place_types" ("id", "name", "slug", "description", "icon", "created_at") VALUES ('03fd4998-03d4-49c8-9643-713e62abfc16', 'Bridge', 'bridge', null, null, '2025-11-07 16:51:48.928342'), ('08b8f421-ecf3-4258-b150-caba3f691c3a', 'Art Gallery', 'art-gallery', null, null, '2025-11-07 16:51:48.928342'), ('17b7fa03-6fcd-48a4-a9f1-fbedec1a70c3', 'Local Trattoria', 'local-trattoria', null, null, '2025-11-07 16:51:48.928342'), ('186be722-3a30-4de8-b825-3bd2097c130e', 'Historical Landmark', 'historical-landmark', null, null, '2025-11-07 16:51:48.928342'), ('19130e37-2ca5-4c91-a28d-2d4b5b59b429', 'Waterfall', 'waterfall', null, null, '2025-11-07 16:51:48.928342'), ('1db98591-254f-427e-8c0c-933fe939b3dd', 'Cultural Center', 'cultural-center', null, null, '2025-11-07 16:51:48.928342'), ('231f6f69-13a7-44e1-b459-61b99f732328', 'Mountain Peak', 'mountain-peak', null, null, '2025-11-07 16:51:48.928342'), ('2374b171-59b0-42e8-ba26-0486bf1ab9f8', 'Old Town', 'old-town', null, null, '2025-11-07 16:51:48.928342'), ('26c321a9-b67f-4a8b-b253-d3a559aa360c', 'Tower', 'tower', null, null, '2025-11-07 16:51:48.928342'), ('2bfb1fa8-171a-480c-b571-f41de4dfb006', 'Theatre', 'theatre', null, null, '2025-11-07 16:51:48.928342'), ('2fff5412-6ef4-4d40-b7e8-26bd9165ad87', 'Thermal Bath', 'thermal-bath', null, null, '2025-11-07 16:51:48.928342'), ('375aace5-5f66-4d52-81a6-9980071e5f6a', 'Aperitivo Bar', 'aperetivo-bar', null, null, '2025-11-07 16:51:48.928342'), ('37b0a837-405a-42db-b93d-e33906938555', 'Vintage Store', 'vintage-store', null, null, '2025-11-07 16:51:48.928342'), ('427fa8bd-221f-4fae-a549-c4dd585509fa', 'Picnic Area', 'picnic-area', null, null, '2025-11-07 16:51:48.928342'), ('438e8ec2-d334-4b2f-922a-c86c5e85df02', 'Karaoke Bar', 'karaoke-bar', null, null, '2025-11-07 16:51:48.928342'), ('4800106d-44eb-4bd2-9108-b5ab5440bd52', 'Dessert Bar', 'gelateria', null, null, '2025-11-07 16:51:48.928342'), ('48ce410f-0d4c-42f3-a014-f504aa6d51d0', 'Street Art Area', 'street-art-area', null, null, '2025-11-07 16:51:48.928342'), ('4948e5c9-5664-4b7b-accc-1e58202144bd', 'Forest Walk', 'forest-walk', null, null, '2025-11-07 16:51:48.928342'), ('4cd33aca-c7cf-4872-bffe-43d0493ba078', 'Live Music Venue', 'live-music-venue', null, null, '2025-11-07 16:51:48.928342'), ('4d153b5e-f23e-4265-8308-d9e60c00895d', 'Lake', 'lake', null, null, '2025-11-07 16:51:48.928342'), ('4de2c488-a924-4eda-8b8f-64844607abb7', 'Library', 'library', null, null, '2025-11-07 16:51:48.928342'), ('4eae4a51-24df-486e-ab02-da372a032054', 'Rooftop Bar', 'rooftop-bar', null, null, '2025-11-07 16:51:48.928342'), ('59ccab91-8111-48a4-bac8-f9cce56d221e', 'Specialty Coffee', 'specialty-coffee', null, null, '2025-11-07 16:51:48.928342'), ('60ea290e-0608-46d4-8b5a-306bfce298b1', 'Scenic Cafe', 'scenic-cafe', null, null, '2025-11-07 16:51:48.928342'), ('626c1a58-e07a-4792-8032-8398c60c80c2', 'Artisanal Shop', 'artisanal-shop', null, null, '2025-11-07 16:51:48.928342'), ('654cd55a-e9ae-4540-938a-c471a360e0de', 'Wine Shop', 'wine-shop', null, null, '2025-11-07 16:51:48.928342'), ('6798304a-c81c-45e1-a353-088a215638ec', 'Local Festival Area', 'festival-area', null, null, '2025-11-07 16:51:48.928342'), ('684f7563-325f-4b6b-91b3-7908dd891492', 'Street Food', 'street-food', null, null, '2025-11-07 16:51:48.928342'), ('698b7e86-7c61-46ae-b09a-bd34154d6f79', 'River Walk', 'river-walk', null, null, '2025-11-07 16:51:48.928342'), ('70222dc6-ea87-4ba8-863f-c0fb3757d6b2', 'Commercial Nightclub', 'commercial-nightclub', null, null, '2025-11-07 16:51:48.928342'), ('7890544e-f613-46b4-a497-c907a6ac40a7', 'Church', 'church', null, null, '2025-11-07 16:51:48.928342'), ('8723274f-0a94-41ae-a148-63a550e894c0', 'Contemporary Art Space', 'contemporary-art', null, null, '2025-11-07 16:51:48.928342'), ('943cd7ea-b4c2-41ba-9c53-36d0eee1b267', 'City Square', 'city-square', null, null, '2025-11-07 16:51:48.928342'), ('9928b157-9007-4ef3-a9ca-e7a384f7270b', 'Castle', 'castle', null, null, '2025-11-07 16:51:48.928342'), ('9b2b1c4d-dd9e-4f23-9f3e-f61d0ed5c728', 'Restaurant', 'restaurant', null, null, '2025-11-07 16:51:48.928342'), ('9d2cbc79-e475-4654-bcd9-212e3e7b2bc9', 'Street', 'street', null, null, '2025-11-07 16:51:48.928342'), ('9fd58132-3035-45b3-9f11-852e4017b39c', 'Viewpoint', 'viewpoint', null, null, '2025-11-07 16:51:48.928342'), ('a7242a6b-7cd0-4fd4-830b-3bd82a421cc5', 'Hiking Trail', 'hiking-trail', null, null, '2025-11-07 16:51:48.928342'), ('a72a9506-f6c2-432c-ae2e-829783b8c7fd', 'Museum', 'museum', null, null, '2025-11-07 16:51:48.928342'), ('ab371fcf-b3c4-489e-8f33-17b4b4122304', 'Exhibition Hall', 'exhibition-hall', null, null, '2025-11-07 16:51:48.928342'), ('abc2e944-a254-407c-ba10-99caf10b4d9f', 'Botanical Garden', 'botanical-garden', null, null, '2025-11-07 16:51:48.928342'), ('ad018281-5f5d-49b6-845c-c032045d95c7', 'Cinema', 'cinema', null, null, '2025-11-07 16:51:48.928342'), ('af292402-2887-4e6d-b9c9-9dffc6461da7', 'Beach', 'beach', null, null, '2025-11-07 16:51:48.928342'), ('b45af853-2d03-4b45-814c-160c10f35df8', 'Co-working Café', 'coworking-cafe', null, null, '2025-11-07 16:51:48.928342'), ('b45f8bac-f152-481d-aa26-bb4b98f34a4e', 'Craft Beer Pub', 'craft-beer-pub', null, null, '2025-11-07 16:51:48.928342'), ('bcc25cda-1657-4a22-8f94-b40249bba913', 'Spa', 'spa', null, null, '2025-11-07 16:51:48.928342'), ('bd205a89-5ce6-42b7-9f1b-a0f0831d8e00', 'Adventure Park', 'adventure-park', null, null, '2025-11-07 16:51:48.928342'), ('bdf468a2-3f0c-43d5-95aa-7309a566e77c', 'Specialty Coffee Bar', 'specialty-coffee-bar', null, null, '2025-11-07 16:51:48.928342'), ('bebd82ec-b4a4-4bb6-9b27-ca26b04922b5', 'Local Market', 'local-market', null, null, '2025-11-07 16:51:48.928342'), ('c7257d8c-f64c-498c-89ac-7d34568cab79', 'Yoga Studio', 'yoga-studio', null, null, '2025-11-07 16:51:48.928342'), ('d10b2279-94a4-42d0-99d6-66a66237d865', 'Park', 'park', null, null, '2025-11-07 16:51:48.928342'), ('d377dd30-df9e-44d3-87d4-ef562268a78c', 'Cultural Event Venue', 'cultural-event-venue', null, null, '2025-11-07 16:51:48.928342'), ('d39b876f-5a45-4617-bdba-33c61906c4e3', 'Bookstore', 'bookstore', null, null, '2025-11-07 16:51:48.928342'), ('d72c9b1a-6597-4361-953e-05edcb06e1dd', 'Cafe', 'cafe', null, null, '2025-11-07 16:51:48.928342'), ('d8537c10-3da5-4865-8b7b-798a94aafcb8', 'Student Pub', 'student-pub', null, null, '2025-11-07 16:51:48.928342'), ('dc12006f-c687-4327-bdcc-002fdb4a1752', 'Shopping Centre', 'shoopping-centre', null, null, '2025-11-07 16:51:48.928342'), ('e0b6df62-472f-4142-8482-254fef13b589', 'Food Market', 'food-market', null, null, '2025-11-07 16:51:48.928342'), ('f547a107-b934-4a65-94e8-c83dfd4fe1cb', 'Underground Club', 'underground-club', null, null, '2025-11-07 16:51:48.928342'), ('f6db0508-7bc3-4a28-8885-28c678beb7fd', 'Concept Store', 'concept-store', null, null, '2025-11-07 16:51:48.928342'), ('f970e4d9-de68-4010-9133-5aa184161729', 'Comedy Club', 'comedy-club', null, null, '2025-11-07 16:51:48.928342'), ('fed0a8b7-4645-44a8-9214-c52628a44bc5', 'Pizzeria', 'pizzeria', null, null, '2025-11-07 16:51:48.928342');


