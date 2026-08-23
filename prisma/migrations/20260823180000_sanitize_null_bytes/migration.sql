-- Sanitiza null bytes (U+0000) em campos String da tabela Product.
-- O driver Prisma 5 (Rust/napi) lança "Failed to convert rust String into napi string"
-- quando lê qualquer campo String que contenha o caractere U+0000.
--
-- NOTA: chr(0) não é aceito pelo PostgreSQL do Railway (error 54000).
-- Usamos E'\x00' (escape string syntax) que é suportado em todas as versões do PG.

UPDATE "Product"
SET
  "name"                = REPLACE("name",                E'\x00', ''),
  "slug"                = REPLACE("slug",                E'\x00', ''),
  "description"         = REPLACE("description",         E'\x00', ''),
  "mainImage"           = REPLACE("mainImage",           E'\x00', ''),
  "driveLink"           = REPLACE("driveLink",           E'\x00', ''),
  "driveDeliveryMethod" = REPLACE("driveDeliveryMethod", E'\x00', ''),
  "status"              = REPLACE("status",              E'\x00', ''),
  "youtubeUrl"          = REPLACE("youtubeUrl",          E'\x00', '')
WHERE
  "name"          ~ E'\x00'
  OR "description" ~ E'\x00'
  OR "mainImage"   ~ E'\x00'
  OR "driveLink"   ~ E'\x00'
  OR "youtubeUrl"  ~ E'\x00';
