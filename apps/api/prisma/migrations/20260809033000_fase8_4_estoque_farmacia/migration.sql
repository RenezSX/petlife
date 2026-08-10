-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'MEDICATION',
    "unit" TEXT NOT NULL,
    "currentQuantity" REAL NOT NULL DEFAULT 0,
    "minimumQuantity" REAL NOT NULL DEFAULT 0,
    "batch" TEXT,
    "expiryDate" DATETIME,
    "supplier" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "beforeQty" REAL NOT NULL,
    "afterQty" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "responsible" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "InventoryItem_name_idx" ON "InventoryItem"("name");
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");
CREATE INDEX "InventoryItem_active_idx" ON "InventoryItem"("active");
CREATE INDEX "InventoryItem_expiryDate_idx" ON "InventoryItem"("expiryDate");
CREATE INDEX "InventoryMovement_itemId_idx" ON "InventoryMovement"("itemId");
CREATE INDEX "InventoryMovement_type_idx" ON "InventoryMovement"("type");
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");
