/*
  Warnings:

  - Added the required column `updatedAt` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `NewsPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `businessbadge` DROP FOREIGN KEY `BusinessBadge_badgeId_fkey`;

-- DropForeignKey
ALTER TABLE `businessbadge` DROP FOREIGN KEY `BusinessBadge_businessId_fkey`;

-- DropForeignKey
ALTER TABLE `menuitem` DROP FOREIGN KEY `MenuItem_businessId_fkey`;

-- DropForeignKey
ALTER TABLE `newspost` DROP FOREIGN KEY `NewsPost_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_businessId_fkey`;

-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `Review_businessId_fkey`;

-- DropForeignKey
ALTER TABLE `service` DROP FOREIGN KEY `Service_businessId_fkey`;

-- DropIndex
DROP INDEX `BusinessBadge_badgeId_fkey` ON `businessbadge`;

-- DropIndex
DROP INDEX `MenuItem_businessId_fkey` ON `menuitem`;

-- DropIndex
DROP INDEX `NewsPost_authorId_fkey` ON `newspost`;

-- DropIndex
DROP INDEX `Product_businessId_fkey` ON `product`;

-- DropIndex
DROP INDEX `Review_businessId_fkey` ON `review`;

-- DropIndex
DROP INDEX `Service_businessId_fkey` ON `service`;

-- AlterTable
ALTER TABLE `authorprofile` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `business` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `menuitem` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `dietary` JSON NULL;

-- AlterTable
ALTER TABLE `newspost` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `content` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `pricingpackage` MODIFY `featured` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `inStock` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `service` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `user` ADD COLUMN `emailVerified` DATETIME(3) NULL,
    ADD COLUMN `passwordHash` VARCHAR(191) NULL,
    MODIFY `name` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `role` ENUM('admin', 'business_owner', 'author', 'editor', 'subscriber', 'guest') NOT NULL DEFAULT 'guest';

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BusinessBadge` ADD CONSTRAINT `BusinessBadge_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BusinessBadge` ADD CONSTRAINT `BusinessBadge_badgeId_fkey` FOREIGN KEY (`badgeId`) REFERENCES `Badge`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MenuItem` ADD CONSTRAINT `MenuItem_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Service` ADD CONSTRAINT `Service_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NewsPost` ADD CONSTRAINT `NewsPost_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `AuthorProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
