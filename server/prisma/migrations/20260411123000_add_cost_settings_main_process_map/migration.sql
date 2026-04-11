-- Add per-product selected main process map for auto-cost calculations.
ALTER TABLE `CostSettings`
    ADD COLUMN `productMainProcessMaps` JSON NULL;

UPDATE `CostSettings`
SET `productMainProcessMaps` = JSON_OBJECT()
WHERE `productMainProcessMaps` IS NULL;

ALTER TABLE `CostSettings`
    MODIFY `productMainProcessMaps` JSON NOT NULL;
