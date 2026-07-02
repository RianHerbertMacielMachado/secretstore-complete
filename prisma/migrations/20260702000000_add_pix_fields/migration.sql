-- AlterTable: adicionar campos PIX no model Order
ALTER TABLE "Order" ADD COLUMN "pixQrCodeBase64" TEXT;
ALTER TABLE "Order" ADD COLUMN "pixCopiaECola" TEXT;
ALTER TABLE "Order" ADD COLUMN "pixExpiresAt" TIMESTAMP(3);
