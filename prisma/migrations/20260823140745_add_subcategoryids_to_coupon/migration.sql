-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_subCategoryId_fkey";

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "subCategoryIds" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "StoreSettings" ALTER COLUMN "id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
