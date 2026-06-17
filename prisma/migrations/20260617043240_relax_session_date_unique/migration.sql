-- DropForeignKey (ต้อง drop FK ก่อน drop index ที่ FK อาจอ้างถึง)
ALTER TABLE `ClassSession` DROP FOREIGN KEY `ClassSession_courseId_fkey`;

-- DropIndex (เลิกบังคับ unique บน (courseId, date) — ให้มีหลายคาบต่อวันได้)
DROP INDEX `ClassSession_courseId_date_key` ON `ClassSession`;

-- CreateIndex
CREATE INDEX `ClassSession_date_idx` ON `ClassSession`(`date`);

-- AddForeignKey (เพิ่ม FK ที่ drop ไปกลับคืน เหมือนเดิมเป๊ะ)
ALTER TABLE `ClassSession` ADD CONSTRAINT `ClassSession_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
