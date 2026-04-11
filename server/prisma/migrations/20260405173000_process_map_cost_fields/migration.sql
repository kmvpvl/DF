-- Add per-process-map cost fields so each process map can store its own values.
ALTER TABLE `ProcessMap`
    ADD COLUMN `VAT` DOUBLE NOT NULL DEFAULT 20.0,
    ADD COLUMN `containerCost` DOUBLE NOT NULL DEFAULT 35.0,
    ADD COLUMN `weight` DOUBLE NOT NULL DEFAULT 100.0,
    ADD COLUMN `marginalCoefficient` DOUBLE NOT NULL DEFAULT 2.01;
