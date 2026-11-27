ALTER TABLE Product DROP COLUMN name;
ALTER TABLE Product CHANGE nameJson name JSON;

ALTER TABLE Product DROP COLUMN description;
ALTER TABLE Product CHANGE descriptionJson description JSON;

ALTER TABLE `Product` 
    MODIFY `name` JSON NOT NULL,
    MODIFY `description` JSON NOT NULL;
