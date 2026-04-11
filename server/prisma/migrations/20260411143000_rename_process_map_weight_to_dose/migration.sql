-- Rename ProcessMap weight column to dose
ALTER TABLE `ProcessMap`
  CHANGE COLUMN `weight` `dose` DOUBLE NOT NULL DEFAULT 100;
