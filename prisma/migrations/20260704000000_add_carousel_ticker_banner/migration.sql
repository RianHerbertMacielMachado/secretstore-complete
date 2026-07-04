-- AlterTable: adicionar bannerImage na SubCategory
ALTER TABLE "SubCategory" ADD COLUMN "bannerImage" TEXT;

-- CreateTable: CarouselItem (carrossel configurável da home)
CREATE TABLE "CarouselItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CarouselItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TickerItem (faixa de avisos do topo)
CREATE TABLE "TickerItem" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TickerItem_pkey" PRIMARY KEY ("id")
);
