-- Seed dos programas de venda (idempotente)
INSERT INTO "Company" ("name", "type", "icon", "createdAt", "updatedAt")
VALUES
  ('Nextgate',   'SALE', NULL, NOW(), NOW()),
  ('MaxMilhas',  'SALE', NULL, NOW(), NOW()),
  ('Bankmilhas', 'SALE', NULL, NOW(), NOW()),
  ('Hotmilhas',  'SALE', NULL, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;
