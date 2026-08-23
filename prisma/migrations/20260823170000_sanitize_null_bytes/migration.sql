-- Sanitiza null bytes (\u0000) em campos String da tabela Product.
-- O driver Prisma 5 (Rust/napi) lança "Failed to convert rust String into napi string"
-- quando lê qualquer campo String que contenha o caractere U+0000.
-- Este UPDATE substitui \u0000 por string vazia em todos os campos de texto.

UPDATE "Product"
SET
  "name"                = REPLACE("name",                chr(0), ''),
  "slug"                = REPLACE("slug",                chr(0), ''),
  "description"         = REPLACE("description",         chr(0), ''),
  "mainImage"           = REPLACE("mainImage",           chr(0), ''),
  "driveLink"           = REPLACE("driveLink",           chr(0), ''),
  "driveDeliveryMethod" = REPLACE("driveDeliveryMethod", chr(0), ''),
  "status"              = REPLACE("status",              chr(0), ''),
  "youtubeUrl"          = REPLACE("youtubeUrl",          chr(0), '')
WHERE
  "name"                LIKE '%' || chr(0) || '%'
  OR "description"      LIKE '%' || chr(0) || '%'
  OR "mainImage"        LIKE '%' || chr(0) || '%'
  OR "driveLink"        LIKE '%' || chr(0) || '%'
  OR "youtubeUrl"       LIKE '%' || chr(0) || '%';
