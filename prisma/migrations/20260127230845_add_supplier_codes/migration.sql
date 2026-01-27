-- CreateTable
CREATE TABLE "SupplierCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "provider" TEXT,
    "productId" INTEGER NOT NULL,
    CONSTRAINT "SupplierCode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
