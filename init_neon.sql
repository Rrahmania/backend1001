-- init_neon.sql
-- A Neon-safe version of init.sql: creates schema/tables/views/triggers
-- without modifying roles/users or granting privileges.

-- Drop tables if they exist (order chosen to avoid FK errors)
DROP TABLE IF EXISTS update_resep CASCADE;
DROP TABLE IF EXISTS favorit CASCADE;
DROP TABLE IF EXISTS resep CASCADE;
DROP TABLE IF EXISTS kategori CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create kategori
CREATE TABLE IF NOT EXISTS kategori (
    id SERIAL PRIMARY KEY,
    nama_kategori VARCHAR(150) NOT NULL
);

INSERT INTO kategori (nama_kategori)
VALUES
('Daging'),
('Ikan'),
('Makanan Cepat saji'),
('Sayuran'),
('Makanan penutup')
ON CONFLICT DO NOTHING;

-- Create resep
CREATE TABLE IF NOT EXISTS resep (
    id SERIAL PRIMARY KEY,
    nama_resep VARCHAR(150) NOT NULL,
    deskripsi TEXT,
    ingredients TEXT,
    kategori_id INTEGER,
    gambar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id)
);

-- Sample inserts (idempotent: use ON CONFLICT to avoid duplicates)
INSERT INTO resep (nama_resep, deskripsi, ingredients, kategori_id, gambar)
VALUES
('Ayam Geprek','Ayam goreng sambal bawang pedas.','Ayam, cabai, bawang',1,'https://img-global.cpcdn.com/recipes/df40bcf6eefca280/680x781cq80/ayam-geprek-simple-foto-resep-utama.jpg')
ON CONFLICT DO NOTHING;

INSERT INTO resep (nama_resep, deskripsi, ingredients, kategori_id, gambar)
VALUES
('Tumis Labu Siam Rebon Wortel','Sayur labu dan wortel yang dipadu.', E'1 buah labu siam\n1 buah wortel\n1 sdm rebon\n100 ml air\n5 siung bawang merah\n3 siung bawang putih\n2 cabe merah\n1 sdm saus tiram\n1 sdt gula\n1 sdt kaldu\n1/2 sdt garam',4,'https://img-global.cpcdn.com/recipes/a840f3239356f864/300x426f0.5_0.5_1.0q80/tumis-labu-siam-rebon-wortel-foto-resep-utama.webp')
ON CONFLICT DO NOTHING;

INSERT INTO resep (nama_resep, deskripsi, ingredients, kategori_id, gambar)
VALUES
('Ikan Nila Segar Asam Manis','Perpaduan ikan nila dengan nanas dan bombai.', E'Ikan nila 1 ekor\nNanas\nBawang bombay\nBawang putih\nBawang merah\nTomat\nCabe merah\nDaun bawang\nSaus tomat\nSaus sambal\nPenyedap\nGaram\nMerica',2,'https://img-global.cpcdn.com/recipes/e8a54ad3af478ddf/640x640sq80/photo.webp')
ON CONFLICT DO NOTHING;

INSERT INTO resep (nama_resep, deskripsi, ingredients, kategori_id, gambar)
VALUES
('Kebab Ayam','Ayam dan sayuran yang digabung.', E'3 roll wrap\nIsian ayam\nTomat iris\nTimun iris\nSelada',3,'https://img-global.cpcdn.com/recipes/5fbf8244cf4d03e9/300x426f0.5_0.5_1.0q80/kebab-ayam-foto-resep-utama.webp')
ON CONFLICT DO NOTHING;

INSERT INTO resep (nama_resep, deskripsi, ingredients, kategori_id, gambar)
VALUES
('Kolak Labu Kuning','Perpaduan santan dengan pisang dan ubi dengan aroma daun pandan.', E'1/2 labu kuning\nGula merah\nSantan\nGaram\nAir',5,'https://img-global.cpcdn.com/recipes/2b8ce47b5ff5e1da/300x426f0.5_0.506964_1.0q80/kolak-labu-kuning-foto-resep-utama.webp')
ON CONFLICT DO NOTHING;

INSERT INTO resep (nama_resep, deskripsi, ingredients, kategori_id, gambar)
VALUES
('Rendang Daging Sapi Padang','Daging sapi dengan bumbu lengkap.', E'500g daging sapi\n750ml santan\nGaram\nKecap\nCabai merah\nCabai pedas\nBawang merah\nBawang putih\nLengkuas\nSerai\nBunga lawang\nKayu manis\nPala\nDaun jeruk\nDaun salam\nKetumbar bubuk',1,'https://img-global.cpcdn.com/recipes/2033c1003b3b3e86/300x426f0.5434_0.499372_1.00126q80/rendang-daging-sapi-padang-foto-resep-utama.webp')
ON CONFLICT DO NOTHING;

-- Create favorit table
CREATE TABLE IF NOT EXISTS favorit (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    resep_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (resep_id) REFERENCES resep(id)
);

-- Create update_resep table
CREATE TABLE IF NOT EXISTS update_resep (
    id SERIAL PRIMARY KEY,
    resep_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    nama_resep VARCHAR(150),
    ingredients TEXT,
    deskripsi TEXT,
    gambar TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resep_id) REFERENCES resep(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_resep_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.created_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_resep
BEFORE UPDATE ON resep
FOR EACH ROW
EXECUTE FUNCTION update_resep_timestamp();

-- Views
CREATE OR REPLACE VIEW view_resep_kategori AS
SELECT 
    r.id,
    r.nama_resep,
    r.deskripsi,
    r.ingredients,
    r.gambar,
    k.nama_kategori
FROM resep r
JOIN kategori k ON r.kategori_id = k.id;

CREATE OR REPLACE VIEW view_favorit_user AS
SELECT u.username, r.nama_resep
FROM favorit f
JOIN users u ON f.user_id = u.id
JOIN resep r ON f.resep_id = r.id;
