ALTER TABLE `Location`
    ADD COLUMN `availablePaymentMethods` JSON NULL,
    ADD COLUMN `availableShippingMethods` JSON NULL;
