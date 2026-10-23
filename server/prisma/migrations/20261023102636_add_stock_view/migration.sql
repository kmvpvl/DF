-- migration.sql
CREATE OR REPLACE VIEW view_stock_free_balance AS
SELECT 
    m.productId,
    m.locationId,
    -- Физический остаток (движения)
    SUM(CASE 
        WHEN m.type IN ('PURCHASE', 'PRODUCTION', 'MOVE_IN', 'RETURN') THEN m.quantity 
        WHEN m.type IN ('SALE', 'WRITE_OFF', 'MOVE_OUT') THEN -m.quantity 
        ELSE 0 
    END) as physical_balance,
    -- Забронировано (сумма из неоплаченных/неотгруженных заказов)
    (SELECT COALESCE(SUM(op.quantity), 0)
     FROM OrderProduct op
     JOIN `Order` o ON op.orderId = o.id
     WHERE op.productId = m.productId 
       AND o.locationId = m.locationId
       AND o.status IN ('DRAFT', 'CONFIRMED', 'IN_PRODUCTION')) as reserved_balance
FROM Movement m
GROUP BY m.productId, m.locationId;

-- При откате миграции нужно удалять вьюху
-- DROP VIEW "view_stock_free_balance";