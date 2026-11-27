-- This is an empty migration.
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
     and (m.variantLabel = op.variantLabel OR (m.variantLabel IS NULL AND op.variantLabel IS NULL))
     AND o.locationId = m.locationId
     AND o.status IN ('DRAFT', 'CONFIRMED', 'IN_PRODUCTION')) as reserved_balance
FROM Movement m
JOIN Product p ON m.productId = p.id
WHERE p.isPublic = true
GROUP BY m.productId, m.locationId, m.variantlabel;
