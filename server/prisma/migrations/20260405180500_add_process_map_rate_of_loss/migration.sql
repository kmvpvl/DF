-- Add per-process-map loss rate (percentage).
ALTER TABLE `ProcessMap`
    ADD COLUMN `rateOfLoss` DOUBLE NOT NULL DEFAULT 0.0;
