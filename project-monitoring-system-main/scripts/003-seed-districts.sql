-- Seed 10 Zambian Districts
INSERT INTO districts (name, code) VALUES
  ('Lusaka', 'LSK'),
  ('Ndola', 'NDL'),
  ('Kitwe', 'KTW'),
  ('Kabwe', 'KBW'),
  ('Chingola', 'CHG'),
  ('Livingstone', 'LVS'),
  ('Mufulira', 'MFL'),
  ('Luanshya', 'LNS'),
  ('Chipata', 'CPT'),
  ('Kasama', 'KSM')
ON CONFLICT (name) DO NOTHING;
