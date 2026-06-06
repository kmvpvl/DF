ALTER TABLE `Batch`
    CHANGE `storageDurationHours` `storageDurationDays` INT;
UPDATE `Batch`
    SET `storageDurationDays` = `storageDurationDays` DIV 24;

