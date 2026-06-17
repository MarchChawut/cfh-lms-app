-- AlterTable
ALTER TABLE `ClassSession` ADD COLUMN `endTime` VARCHAR(191) NULL,
    ADD COLUMN `startTime` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Course` ADD COLUMN `defaultEndTime` VARCHAR(191) NULL,
    ADD COLUMN `defaultStartTime` VARCHAR(191) NULL;
