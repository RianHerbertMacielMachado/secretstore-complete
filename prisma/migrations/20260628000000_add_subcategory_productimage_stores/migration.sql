-- ============================================================
-- Migration: add_subcategory_productimage_stores
-- Adds: SubCategory, ProductImage, StoreSettings models
-- Refactors: Product now belongs to SubCategory (not Category)
-- Adds: youtubeUrl to Product
-- ============================================================

-- Step 1: Create SubCategory table
CREATE TABLE "SubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- Step 2: Unique index on SubCategory.slug
CREATE UNIQUE INDEX "SubCategory_slug_key" ON "SubCategory"("slug");

-- Step 3: FK SubCategory -> Category
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Create a default SubCategory for existing products (data migration)
-- Insert one SubCategory per existing Category
INSERT INTO "SubCategory" ("id", "name", "slug", "categoryId", "isVisible", "sortOrder", "updatedAt")
SELECT
    'sub_' || id,
    name,
    slug || '-geral',
    id,
    true,
    0,
    NOW()
FROM "Category";

-- Step 5: Add subCategoryId column to Product (nullable first)
ALTER TABLE "Product" ADD COLUMN "subCategoryId" TEXT;

-- Step 6: Populate subCategoryId from existing categoryId (map to default subcategory)
UPDATE "Product" SET "subCategoryId" = 'sub_' || "categoryId";

-- Step 7: Now make subCategoryId NOT NULL
ALTER TABLE "Product" ALTER COLUMN "subCategoryId" SET NOT NULL;

-- Step 8: Add youtubeUrl to Product
ALTER TABLE "Product" ADD COLUMN "youtubeUrl" TEXT;

-- Step 9: FK Product -> SubCategory
ALTER TABLE "Product" ADD CONSTRAINT "Product_subCategoryId_fkey"
    FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON UPDATE CASCADE;

-- Step 10: Drop old FK Product -> Category (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Product_categoryId_fkey'
      AND table_name = 'Product'
  ) THEN
    ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";
  END IF;
END $$;

-- Step 11: Drop old categoryId column from Product
ALTER TABLE "Product" DROP COLUMN IF EXISTS "categoryId";

-- Step 12: Drop old images column from Product (we move to ProductImage)
ALTER TABLE "Product" DROP COLUMN IF EXISTS "images";

-- Step 13: Create ProductImage table
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- Step 14: FK ProductImage -> Product
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 15: Migrate existing mainImage into ProductImage
INSERT INTO "ProductImage" ("id", "url", "order", "productId")
SELECT
    'img_main_' || id,
    "mainImage",
    0,
    id
FROM "Product"
WHERE "mainImage" IS NOT NULL AND "mainImage" != '';

-- Step 16: Create StoreSettings table
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "discordUrl" TEXT,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- Step 17: Insert default StoreSettings row
INSERT INTO "StoreSettings" ("id") VALUES ('singleton') ON CONFLICT DO NOTHING;

-- Step 18: Remove products relation from Category (already done by removing categoryId from Product)
-- Category now relates only to SubCategory

