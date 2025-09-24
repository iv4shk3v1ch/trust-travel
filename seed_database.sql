-- =====================================================
-- DATABASE SEEDING SCRIPT FOR TRUST TRAVEL APP
-- =====================================================
-- This script creates 10 new places and 40 reviews in Trento, Italy
-- Run this in your Supabase SQL Editor after the reviews table migration
-- =====================================================

-- First, let's create some additional test places in Trento
-- Note: We'll let Supabase generate UUIDs automatically, then reference them for reviews

-- Step 1: Create places and store their generated IDs in temporary variables
-- We'll insert places first, then get their IDs to use for reviews

INSERT INTO "public"."places" ("name", "city", "country", "category", "working_hours", "created_by", "address", "website", "phone", "photo_urls", "indoor_outdoor", "verified", "description") VALUES 

-- Restaurants and Food Places
('Osteria del Borgo', 'Trento', 'Italy', 'restaurant', '12:00-14:30, 19:00-22:30', '34411fa3-676e-424c-9c47-21c66364179c', 'Via del Borgo, 45, 38122 Trento TN', 'https://osteriadelborgo-trento.it', '+390461234567', '{}', 'indoor', false, 'Traditional Trentino cuisine in a cozy medieval setting. Famous for their canederli and local wines.'),

('Caffè Centrale', 'Trento', 'Italy', 'coffee-shop', '07:00-20:00', '638e97c8-868c-433d-89bd-f3d267681aee', 'Piazza Duomo, 12, 38122 Trento TN', 'https://caffecentrale-trento.com', '+390461345678', '{}', 'indoor', false, 'Historic coffee shop in the main square. Perfect for morning espresso and people watching.'),

('Birreria Pedavena', 'Trento', 'Italy', 'bar', '18:00-02:00', '34411fa3-676e-424c-9c47-21c66364179c', 'Via Santa Croce, 67, 38122 Trento TN', 'https://pedavena-trento.it', '+390461456789', '{}', 'indoor', false, 'Local brewery with craft beers and traditional Alpine atmosphere. Great for evening drinks.'),

('Gelateria Zanella', 'Trento', 'Italy', 'fast-food', '10:00-23:00', '638e97c8-868c-433d-89bd-f3d267681aee', 'Via Manci, 23, 38122 Trento TN', null, '+390461567890', '{}', 'indoor', false, 'Artisanal gelato shop with unique flavors. Made fresh daily with local ingredients.'),

-- Cultural and Entertainment Places
('Castello del Buonconsiglio', 'Trento', 'Italy', 'museum', '09:30-17:00', '34411fa3-676e-424c-9c47-21c66364179c', 'Via Bernardo Clesio, 5, 38122 Trento TN', 'https://buonconsiglio.it', '+390461233770', '{}', 'indoor', true, 'Medieval castle and museum showcasing Trentino history and art. Must-see attraction.'),

('Teatro Sociale', 'Trento', 'Italy', 'theater', '20:00-23:00', '638e97c8-868c-433d-89bd-f3d267681aee', 'Via Prepositura, 23, 38122 Trento TN', 'https://teatrosociale.tn.it', '+390461981200', '{}', 'indoor', true, 'Historic theater hosting opera, concerts, and theatrical performances. Beautiful architecture.'),

-- Outdoor and Nature Places
('Monte Bondone', 'Trento', 'Italy', 'hiking-trail', '24h', '34411fa3-676e-424c-9c47-21c66364179c', 'Monte Bondone, 38123 Trento TN', 'https://montebondone.it', null, '{}', 'outdoor', false, 'Mountain plateau with hiking trails, skiing, and panoramic views of Trento valley.'),

('Lago di Toblino', 'Trento', 'Italy', 'viewpoint', '24h', '638e97c8-868c-433d-89bd-f3d267681aee', 'Lago di Toblino, 38070 Sarche TN', null, null, '{}', 'outdoor', false, 'Scenic lake with medieval castle. Perfect for romantic walks and photography.'),

-- Shopping and Services
('Centro Commerciale Trento', 'Trento', 'Italy', 'shopping', '09:00-21:00', '34411fa3-676e-424c-9c47-21c66364179c', 'Via Brennero, 300, 38121 Trento TN', 'https://centrotrento.it', '+390461123456', '{}', 'indoor', false, 'Modern shopping center with fashion, electronics, and dining options.'),

-- Hotel/Accommodation
('Hotel America', 'Trento', 'Italy', 'hotel', '24h', '638e97c8-868c-433d-89bd-f3d267681aee', 'Via Torre Verde, 50, 38122 Trento TN', 'https://hotelamerica.it', '+390461983010', '{}', 'indoor', true, 'Boutique hotel in the historic center. Elegant rooms with mountain views and excellent service.');

-- Now let's create reviews for the places we just created
-- We'll use place names to match them with the generated place IDs through subqueries

-- Reviews for restaurants and food places
INSERT INTO "public"."reviews" ("user_id", "place_id", "place_name", "place_category", "ratings", "experience_tags", "food_price_range", "comment", "photos", "visit_date") VALUES 

-- Reviews for Osteria del Borgo (Restaurant)
('34411fa3-676e-424c-9c47-21c66364179c', (SELECT id FROM places WHERE name = 'Osteria del Borgo' LIMIT 1), 'Osteria del Borgo', 'restaurant', '{"service": 5, "atmosphere": 4, "food_quality": 5}', '{"exceptional-food","cozy","traditional","intimate","local-favorite"}', '35-50', 'Amazing canederli and the local wine selection is outstanding! Staff very knowledgeable about regional dishes.', '{}', '2025-09-20'),

('638e97c8-868c-433d-89bd-f3d267681aee', (SELECT id FROM places WHERE name = 'Osteria del Borgo' LIMIT 1), 'Osteria del Borgo', 'restaurant', '{"service": 4, "atmosphere": 5, "food_quality": 4}', '{"romantic","traditional","friends-group","good-value"}', '35-50', 'Perfect for a romantic dinner. The medieval atmosphere is incredible and food is authentic.', '{}', '2025-09-18'),

('34411fa3-676e-424c-9c47-21c66364179c', (SELECT id FROM places WHERE name = 'Osteria del Borgo' LIMIT 1), 'Osteria del Borgo', 'restaurant', '{"service": 3, "atmosphere": 4, "food_quality": 4}', '{"traditional","crowd-level-medium","friends-group"}', '35-50', 'Good traditional food but service was a bit slow during peak hours.', '{}', '2025-09-15'),

('638e97c8-868c-433d-89bd-f3d267681aee', (SELECT id FROM places WHERE name = 'Osteria del Borgo' LIMIT 1), 'Osteria del Borgo', 'restaurant', '{"service": 5, "atmosphere": 5, "food_quality": 5}', '{"exceptional-food","romantic","intimate","local-favorite","cozy"}', '35-50', 'Absolutely perfect evening! The risotto was divine and the wine pairing was spot on.', '{}', '2025-09-12'),

-- Reviews for Caffè Centrale (Coffee Shop)
('34411fa3-676e-424c-9c47-21c66364179c', (SELECT id FROM places WHERE name = 'Caffè Centrale' LIMIT 1), 'Caffè Centrale', 'coffee-shop', '{"service": 4, "atmosphere": 5}', '{"morning-friendly","central-location","traditional","local-favorite"}', '0-10', 'Perfect espresso and great location for people watching in the main square.', '{}', '2025-09-21'),

('r006-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'a2b3c4d5-e6f7-8901-2345-6789abcdef01', 'Caffè Centrale', 'coffee-shop', '{"service": 5, "atmosphere": 4}', '{"morning-friendly","quick-service","traditional","central-location"}', '0-10', 'Excellent coffee and friendly staff. Always my first stop when visiting Trento.', '{}', '2025-09-19', NOW(), NOW()),

('r007-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'a2b3c4d5-e6f7-8901-2345-6789abcdef01', 'Caffè Centrale', 'coffee-shop', '{"service": 3, "atmosphere": 4}', '{"central-location","crowd-level-high","traditional"}', '0-10', 'Good coffee but can get very crowded in the morning. Historic charm though.', '{}', '2025-09-16', NOW(), NOW()),

('r008-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'a2b3c4d5-e6f7-8901-2345-6789abcdef01', 'Caffè Centrale', 'coffee-shop', '{"service": 4, "atmosphere": 5}', '{"morning-friendly","traditional","local-favorite","central-location"}', '0-10', 'Classic Italian coffee experience. The baristas know their craft well.', '{}', '2025-09-13', NOW(), NOW()),

-- Reviews for Birreria Pedavena (Bar)
('r009-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'b3c4d5e6-f7g8-9012-3456-789abcdef012', 'Birreria Pedavena', 'bar', '{"service": 4, "atmosphere": 5}', '{"nightlife","friends-group","craft-drinks","traditional","local-favorite"}', null, 'Great local beers and authentic Alpine atmosphere. Perfect after hiking!', '{}', '2025-09-17', NOW(), NOW()),

('r010-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'b3c4d5e6-f7g8-9012-3456-789abcdef012', 'Birreria Pedavena', 'bar', '{"service": 5, "atmosphere": 4}', '{"nightlife","craft-drinks","friends-group","good-value"}', null, 'Excellent craft beer selection and knowledgeable staff. Prices are reasonable too.', '{}', '2025-09-14', NOW(), NOW()),

('r011-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'b3c4d5e6-f7g8-9012-3456-789abcdef012', 'Birreria Pedavena', 'bar', '{"service": 4, "atmosphere": 4}', '{"nightlife","friends-group","traditional","crowd-level-medium"}', null, 'Nice place for evening drinks with friends. Good selection of local and international beers.', '{}', '2025-09-11', NOW(), NOW()),

('r012-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'b3c4d5e6-f7g8-9012-3456-789abcdef012', 'Birreria Pedavena', 'bar', '{"service": 3, "atmosphere": 4}', '{"nightlife","crowd-level-high","friends-group"}', null, 'Gets quite busy on weekends but the beer quality is always good.', '{}', '2025-09-08', NOW(), NOW()),

-- Reviews for Gelateria Zanella (Fast Food/Gelato)
('r013-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'c4d5e6f7-g8h9-0123-4567-89abcdef0123', 'Gelateria Zanella', 'fast-food', '{"service": 5, "food_quality": 5}', '{"sweet-treats","family-friendly","unique-flavors","local-favorite"}', '10-20', 'Best gelato in Trento! The pistachio and local honey flavors are incredible.', '{}', '2025-09-22', NOW(), NOW()),

('r014-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'c4d5e6f7-g8h9-0123-4567-89abcdef0123', 'Gelateria Zanella', 'fast-food', '{"service": 4, "food_quality": 5}', '{"sweet-treats","unique-flavors","family-friendly","good-value"}', '10-20', 'Amazing artisanal gelato with seasonal flavors. The texture is perfect and prices fair.', '{}', '2025-09-19', NOW(), NOW()),

('r015-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'c4d5e6f7-g8h9-0123-4567-89abcdef0123', 'Gelateria Zanella', 'fast-food', '{"service": 4, "food_quality": 4}', '{"sweet-treats","family-friendly","quick-service"}', '10-20', 'Good gelato selection and friendly service. Popular with locals and tourists alike.', '{}', '2025-09-16', NOW(), NOW()),

('r016-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'c4d5e6f7-g8h9-0123-4567-89abcdef0123', 'Gelateria Zanella', 'fast-food', '{"service": 5, "food_quality": 4}', '{"sweet-treats","unique-flavors","family-friendly"}', '10-20', 'Creative flavor combinations and very friendly staff. A must-visit in summer!', '{}', '2025-09-13', NOW(), NOW()),

-- Reviews for Castello del Buonconsiglio (Museum)
('r017-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'd5e6f7g8-h9i0-1234-5678-9abcdef01234', 'Castello del Buonconsiglio', 'museum', '{"service": 4, "overall": 5}', '{"cultural","historical","educational","must-visit","impressive-architecture"}', null, 'Fascinating history and beautiful frescoes. The audio guide is very informative.', '{}', '2025-09-18', NOW(), NOW()),

('r018-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'd5e6f7g8-h9i0-1234-5678-9abcdef01234', 'Castello del Buonconsiglio', 'museum', '{"service": 5, "overall": 5}', '{"cultural","historical","must-visit","educational","impressive-architecture"}', null, 'Incredible medieval castle with amazing art collections. Well worth the entrance fee.', '{}', '2025-09-15', NOW(), NOW()),

('r019-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'd5e6f7g8-h9i0-1234-5678-9abcdef01234', 'Castello del Buonconsiglio', 'museum', '{"service": 3, "overall": 4}', '{"cultural","historical","educational","crowd-level-medium"}', null, 'Interesting museum but can get crowded during peak tourist season.', '{}', '2025-09-12', NOW(), NOW()),

('r020-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'd5e6f7g8-h9i0-1234-5678-9abcdef01234', 'Castello del Buonconsiglio', 'museum', '{"service": 4, "overall": 5}', '{"cultural","historical","must-visit","educational"}', null, 'Outstanding collection and beautiful castle architecture. Perfect for history lovers.', '{}', '2025-09-09', NOW(), NOW()),

-- Reviews for Teatro Sociale (Theater)
('r021-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'e6f7g8h9-i0j1-2345-6789-abcdef012345', 'Teatro Sociale', 'theater', '{"service": 5, "overall": 5}', '{"cultural","elegant","romantic","special-occasion","impressive-architecture"}', null, 'Stunning venue with excellent acoustics. The opera performance was magical!', '{}', '2025-09-10', NOW(), NOW()),

('r022-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'e6f7g8h9-i0j1-2345-6789-abcdef012345', 'Teatro Sociale', 'theater', '{"service": 4, "overall": 4}', '{"cultural","elegant","special-occasion","historical"}', null, 'Beautiful historic theater with great performances. Booking in advance is recommended.', '{}', '2025-09-07', NOW(), NOW()),

('r023-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'e6f7g8h9-i0j1-2345-6789-abcdef012345', 'Teatro Sociale', 'theater', '{"service": 4, "overall": 5}', '{"cultural","elegant","romantic","impressive-architecture"}', null, 'Magnificent architecture and wonderful concert experience. A cultural gem in Trento.', '{}', '2025-09-05', NOW(), NOW()),

('r024-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'e6f7g8h9-i0j1-2345-6789-abcdef012345', 'Teatro Sociale', 'theater', '{"service": 3, "overall": 4}', '{"cultural","elegant","historical","formal-dress"}', null, 'Great venue but some seats have limited view. Check seating plan when booking.', '{}', '2025-09-03', NOW(), NOW()),

-- Reviews for Monte Bondone (Hiking Trail)
('r025-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'f7g8h9i0-j1k2-3456-789a-bcdef0123456', 'Monte Bondone', 'hiking-trail', '{"overall": 5}', '{"nature","adventure","scenic-views","challenging","peaceful","fresh-air"}', null, 'Incredible views of the Trento valley! The hiking trails are well-marked and varied in difficulty.', '{}', '2025-09-14', NOW(), NOW()),

('r026-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'f7g8h9i0-j1k2-3456-789a-bcdef0123456', 'Monte Bondone', 'hiking-trail', '{"overall": 4}', '{"nature","adventure","scenic-views","fresh-air","peaceful"}', null, 'Great escape from the city. Multiple trail options and beautiful mountain scenery.', '{}', '2025-09-11', NOW(), NOW()),

('r027-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'f7g8h9i0-j1k2-3456-789a-bcdef0123456', 'Monte Bondone', 'hiking-trail', '{"overall": 5}', '{"nature","adventure","scenic-views","challenging","photography-worthy"}', null, 'Perfect for both hiking and photography. The sunrise views are absolutely breathtaking!', '{}', '2025-09-08', NOW(), NOW()),

('r028-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'f7g8h9i0-j1k2-3456-789a-bcdef0123456', 'Monte Bondone', 'hiking-trail', '{"overall": 4}', '{"nature","peaceful","scenic-views","moderate-difficulty"}', null, 'Nice hiking area with good facilities. Weather can change quickly so come prepared.', '{}', '2025-09-06', NOW(), NOW()),

-- Reviews for Lago di Toblino (Viewpoint)
('r029-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'g8h9i0j1-k2l3-4567-89ab-cdef01234567', 'Lago di Toblino', 'viewpoint', '{"overall": 5}', '{"romantic","scenic-views","peaceful","photography-worthy","nature","fairytale-like"}', null, 'Absolutely magical place! The castle reflection in the lake is like a fairytale scene.', '{}', '2025-09-17', NOW(), NOW()),

('r030-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'g8h9i0j1-k2l3-4567-89ab-cdef01234567', 'Lago di Toblino', 'viewpoint', '{"overall": 4}', '{"romantic","scenic-views","peaceful","photography-worthy"}', null, 'Beautiful lake with the medieval castle. Perfect for a romantic walk or picnic.', '{}', '2025-09-14', NOW(), NOW()),

('r031-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'g8h9i0j1-k2l3-4567-89ab-cdef01234567', 'Lago di Toblino', 'viewpoint', '{"overall": 5}', '{"romantic","scenic-views","peaceful","photography-worthy","nature"}', null, 'One of the most romantic spots in Trentino. The sunset views are incredible!', '{}', '2025-09-11', NOW(), NOW()),

('r032-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'g8h9i0j1-k2l3-4567-89ab-cdef01234567', 'Lago di Toblino', 'viewpoint', '{"overall": 4}', '{"scenic-views","peaceful","photography-worthy","nature","quiet"}', null, 'Serene and beautiful location. Great for photography enthusiasts and nature lovers.', '{}', '2025-09-09', NOW(), NOW()),

-- Reviews for Centro Commerciale Trento (Shopping)
('r033-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'h9i0j1k2-l3m4-5678-9abc-def012345678', 'Centro Commerciale Trento', 'shopping', '{"service": 4, "overall": 4}', '{"shopping","family-friendly","variety","convenient","modern"}', null, 'Good selection of shops and restaurants. Convenient parking and modern facilities.', '{}', '2025-09-16', NOW(), NOW()),

('r034-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'h9i0j1k2-l3m4-5678-9abc-def012345678', 'Centro Commerciale Trento', 'shopping', '{"service": 3, "overall": 3}', '{"shopping","variety","convenient","crowd-level-high"}', null, 'Decent shopping center but can get very crowded on weekends. Good food court.', '{}', '2025-09-13', NOW(), NOW()),

('r035-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'h9i0j1k2-l3m4-5678-9abc-def012345678', 'Centro Commerciale Trento', 'shopping', '{"service": 4, "overall": 4}', '{"shopping","family-friendly","variety","convenient"}', null, 'Has everything you need in one place. Good mix of local and international brands.', '{}', '2025-09-10', NOW(), NOW()),

('r036-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'h9i0j1k2-l3m4-5678-9abc-def012345678', 'Centro Commerciale Trento', 'shopping', '{"service": 4, "overall": 4}', '{"shopping","modern","variety","convenient","air-conditioned"}', null, 'Modern shopping center with good air conditioning. Nice escape on hot summer days.', '{}', '2025-09-07', NOW(), NOW()),

-- Reviews for Hotel America (Hotel)
('r037-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'i0j1k2l3-m4n5-6789-abcd-ef0123456789', 'Hotel America', 'hotel', '{"service": 5, "overall": 5}', '{"luxury","central-location","exceptional-service","comfortable","elegant"}', null, 'Outstanding service and beautiful rooms with mountain views. Perfect location in the historic center.', '{}', '2025-09-12', NOW(), NOW()),

('r038-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'i0j1k2l3-m4n5-6789-abcd-ef0123456789', 'Hotel America', 'hotel', '{"service": 4, "overall": 4}', '{"central-location","comfortable","elegant","good-value"}', null, 'Charming boutique hotel with excellent location. Staff is helpful and rooms are well-appointed.', '{}', '2025-09-09', NOW(), NOW()),

('r039-1234-5678-9abc-def012345678', '34411fa3-676e-424c-9c47-21c66364179c', 'i0j1k2l3-m4n5-6789-abcd-ef0123456789', 'Hotel America', 'hotel', '{"service": 5, "overall": 4}', '{"central-location","comfortable","exceptional-service","quiet"}', null, 'Great hotel with professional staff. The breakfast is excellent and location is unbeatable.', '{}', '2025-09-06', NOW(), NOW()),

('r040-1234-5678-9abc-def012345678', '638e97c8-868c-433d-89bd-f3d267681aee', 'i0j1k2l3-m4n5-6789-abcd-ef0123456789', 'Hotel America', 'hotel', '{"service": 4, "overall": 5}', '{"central-location","elegant","comfortable","romantic"}', null, 'Beautifully decorated rooms and perfect for exploring Trento on foot. Highly recommended!', '{}', '2025-09-04', NOW(), NOW());

-- =====================================================
-- SEEDING COMPLETE
-- =====================================================
-- Summary of what was added:
-- - 10 new places across different categories in Trento
-- - 40 detailed reviews with varied experiences and ratings
-- - Realistic visit dates spread across recent weeks
-- - Diverse experience tags and ratings appropriate for each place type
-- - Food price ranges where applicable (restaurants/cafes)
-- - Both users contributing reviews for variety
-- ====================================================
