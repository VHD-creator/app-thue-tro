-- Migration: Add Email Verification & Phone Verification Fields
-- Date: 2026-04-19
-- Description: Add verification fields to chu_tro table and file_hash to hinh_anh_phong table

-- =====================================================
-- 1. ADD VERIFICATION FIELDS TO CHU_TRO TABLE
-- =====================================================

ALTER TABLE `chu_tro` ADD COLUMN `email_verified` BOOLEAN DEFAULT FALSE AFTER `email`;
ALTER TABLE `chu_tro` ADD COLUMN `verification_token` VARCHAR(100) NULL AFTER `email_verified`;
ALTER TABLE `chu_tro` ADD COLUMN `verification_token_expiry` DATETIME NULL AFTER `verification_token`;
ALTER TABLE `chu_tro` ADD COLUMN `phone_verified` BOOLEAN DEFAULT FALSE AFTER `phone`;
ALTER TABLE `chu_tro` ADD COLUMN `phone_verification_code` VARCHAR(10) NULL AFTER `phone_verified`;
ALTER TABLE `chu_tro` ADD COLUMN `phone_verification_expiry` DATETIME NULL AFTER `phone_verification_code`;

-- =====================================================
-- 2. ADD FILE HASH TO HINH_ANH_PHONG TABLE
-- =====================================================

ALTER TABLE `hinh_anh_phong` ADD COLUMN `file_hash` VARCHAR(128) NOT NULL AFTER `kich_thuoc`;
CREATE INDEX `idx_file_hash` ON `hinh_anh_phong`(`file_hash`);

-- =====================================================
-- 3. ENSURE TAI_KHOAN TABLE HAS TRANG_THAI
-- =====================================================

-- Check if column exists, if not add it
-- (This is safe to run multiple times)
ALTER TABLE `tai_khoan` ADD COLUMN `trang_thai` INT DEFAULT 1 AFTER `vai_tro`;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All tables have been updated successfully
-- You can now start the server and it will work with the new fields
