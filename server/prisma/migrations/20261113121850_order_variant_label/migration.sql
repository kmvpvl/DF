/*
  Warnings:

  - You are about to drop the column `variationLabel` on the `OrderProduct` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Movement` ADD COLUMN `variantLabel` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `OrderProduct` DROP COLUMN `variationLabel`,
    ADD COLUMN `variantLabel` VARCHAR(191) NULL;

CREATE OR REPLACE VIEW view_stock_free_balance AS
SELECT 
    m.productId,
    m.locationId,
    m.variantLabel,
    -- Физический остаток
    SUM(CASE 
        WHEN m.type IN ('PURCHASE', 'PRODUCTION', 'MOVE_IN', 'RETURN') THEN m.quantity 
        WHEN m.type IN ('SALE', 'WRITE_OFF', 'MOVE_OUT') THEN -m.quantity 
        ELSE 0 
    END) as physical_balance,
    -- Забронировано
    (SELECT COALESCE(SUM(op.quantity), 0)
     FROM OrderProduct op
     JOIN `Order` o ON op.orderId = o.id
     WHERE op.productId = m.productId 
     AND o.locationId = m.locationId
     AND o.status IN ('DRAFT', 'CONFIRMED', 'IN_PRODUCTION')) as reserved_balance
FROM Movement m
JOIN Product p ON m.productId = p.id
WHERE p.isPublic = true
GROUP BY m.productId, m.locationId, m.variantlabel;
