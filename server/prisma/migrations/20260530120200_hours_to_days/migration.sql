ALTER TABLE `Batch`
    RENAME `storageDurationHours` TO `storageDurationDays`;
UPDATE `Batch`
    SET `storageDurationDays` = `storageDurationDays` DIV 8;

