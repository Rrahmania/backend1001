-- 1) users (store hashed passwords)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2) kategori
CREATE TABLE IF NOT EXISTS kategori (
  id SERIAL PRIMARY KEY,
  nama_kategori VARCHAR(150) NOT NULL UNIQUE
);

-- 3) resep (add user_id, created_at, updated_at)
CREATE TABLE IF NOT EXISTS resep (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  nama_resep VARCHAR(150) NOT NULL,
  deskripsi TEXT,
  ingredients TEXT,
  kategori_id INTEGER REFERENCES kategori(id) ON DELETE SET NULL,
  gambar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4) favorit (fixed: create table)
CREATE TABLE IF NOT EXISTS favorit (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resep_id INTEGER NOT NULL REFERENCES resep(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5) update_resep (editor workflow)
CREATE TABLE IF NOT EXISTS update_resep (
  id SERIAL PRIMARY KEY,
  resep_id INTEGER NOT NULL REFERENCES resep(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nama_resep VARCHAR(150),
  ingredients TEXT,
  deskripsi TEXT,
  gambar TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6) Trigger to keep updated_at fresh on resep
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_resep ON resep;
CREATE TRIGGER trg_update_resep
BEFORE UPDATE ON resep
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 7) Useful views
CREATE OR REPLACE VIEW view_resep_kategori AS
SELECT 
  r.id,
  r.user_id,
  r.nama_resep,
  r.deskripsi,
  r.ingredients,
  r.gambar,
  k.nama_kategori
FROM resep r
LEFT JOIN kategori k ON r.kategori_id = k.id;

CREATE OR REPLACE VIEW view_favorit_user AS
SELECT u.username, r.nama_resep
FROM favorit f
JOIN users u ON f.user_id = u.id
JOIN resep r ON f.resep_id = r.id;