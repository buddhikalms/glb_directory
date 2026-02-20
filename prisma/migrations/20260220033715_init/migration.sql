/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `AuthorProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `AuthorProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `authorprofile` ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `business` ADD COLUMN `gallery` JSON NULL,
    ADD COLUMN `pricingPackageId` VARCHAR(191) NULL,
    ADD COLUMN `seoKeywords` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `pricingpackage` ADD COLUMN `galleryLimit` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('admin', 'business_owner', 'author', 'editor', 'subscriber', 'guest') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `AuthorProfile_userId_key` ON `AuthorProfile`(`userId`);

-- AddForeignKey
ALTER TABLE `Business` ADD CONSTRAINT `Business_pricingPackageId_fkey` FOREIGN KEY (`pricingPackageId`) REFERENCES `PricingPackage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthorProfile` ADD CONSTRAINT `AuthorProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
