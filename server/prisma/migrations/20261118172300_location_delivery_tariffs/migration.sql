ALTER TABLE `Location`
    ADD COLUMN `deliveryPricePerKm` DOUBLE NULL,
    ADD COLUMN `deliveryDispatchFee` DOUBLE NULL,
    ADD COLUMN `deliveryMeetingFee` DOUBLE NULL;
