import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quan_ly_thue_tro'
});

console.log('✅ Kết nối database thành công!');
console.log(`📊 Database: ${process.env.DB_NAME}`);
console.log(`🔗 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
console.log('');
console.log('🚀 Bắt đầu chạy migration...\n');

try {
  // ===================== MIGRATION 1: CHU_TRO =====================
  console.log('📝 [1/4] Thêm email_verified vào chu_tro...');
  try {
    await connection.execute(`
      ALTER TABLE \`chu_tro\` ADD COLUMN \`email_verified\` BOOLEAN DEFAULT FALSE AFTER \`email\`
    `);
    console.log('    ✅ email_verified: OK');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('    ⏭️  Cột email_verified đã tồn tại, bỏ qua');
    } else {
      throw err;
    }
  }

  console.log('📝 [2/4] Thêm verification_token & verification_token_expiry...');
  try {
    await connection.execute(`
      ALTER TABLE \`chu_tro\` ADD COLUMN \`verification_token\` VARCHAR(100) NULL AFTER \`email_verified\`
    `);
    console.log('    ✅ verification_token: OK');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('    ⏭️  Cột verification_token đã tồn tại, bỏ qua');
    } else {
      throw err;
    }
  }

  try {
    await connection.execute(`
      ALTER TABLE \`chu_tro\` ADD COLUMN \`verification_token_expiry\` DATETIME NULL AFTER \`verification_token\`
    `);
    console.log('    ✅ verification_token_expiry: OK');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('    ⏭️  Cột verification_token_expiry đã tồn tại, bỏ qua');
    } else {
      throw err;
    }
  }

  console.log('📝 [3/4] Thêm phone_verified & confirmation fields...');
  try {
    await connection.execute(`
      ALTER TABLE \`chu_tro\` ADD COLUMN \`phone_verified\` BOOLEAN DEFAULT FALSE
    `);
    console.log('    ✅ phone_verified: OK');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('    ⏭️  Cột phone_verified đã tồn tại, bỏ qua');
    } else if (err.message.includes('Unknown column')) {
      console.log('    ⏭️  Cột không tìm thấy (AFTER phone), thêm mà không chỉ định vị trí');
    } else {
      throw err;
    }
  }

  try {
    await connection.execute(`
      ALTER TABLE \`chu_tro\` ADD COLUMN \`phone_verification_code\` VARCHAR(10) NULL
    `);
    console.log('    ✅ phone_verification_code: OK');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('    ⏭️  Cột phone_verification_code đã tồn tại, bỏ qua');
    } else {
      throw err;
    }
  }

  try {
    await connection.execute(`
      ALTER TABLE \`chu_tro\` ADD COLUMN \`phone_verification_expiry\` DATETIME NULL
    `);
    console.log('    ✅ phone_verification_expiry: OK');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('    ⏭️  Cột phone_verification_expiry đã tồn tại, bỏ qua');
    } else {
      throw err;
    }
  }

  // ===================== MIGRATION 2: HINH_ANH_PHONG =====================
  console.log('📝 [4/5] Thêm file_hash vào hinh_anh_phong...');
  try {
    await connection.execute(`
      ALTER TABLE \`hinh_anh_phong\` ADD COLUMN \`file_hash\` VARCHAR(128) NOT NULL AFTER \`kich_thuoc\`
    `);
    console.log('    ✅ file_hash: OK');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('    ⏭️  Cột file_hash đã tồn tại, bỏ qua');
    } else {
      throw err;
    }
  }

  console.log('📝 [5/6] Tạo index cho file_hash...');
  try {
    await connection.execute(`
      CREATE INDEX \`idx_file_hash\` ON \`hinh_anh_phong\`(\`file_hash\`)
    `);
    console.log('    ✅ Index idx_file_hash: OK');
  } catch (err) {
    if (err.code === 'ER_DUP_KEY_NAME') {
      console.log('    ⏭️  Index idx_file_hash đã tồn tại, bỏ qua');
    } else {
      throw err;
    }
  }

  // ===================== MIGRATION 3: TAI_KHOAN =====================
  console.log('📝 [6/6] Đảm bảo tai_khoan có cột trang_thai...');
  try {
    await connection.execute(`
      ALTER TABLE \`tai_khoan\` ADD COLUMN \`trang_thai\` INT DEFAULT 1 AFTER \`vai_tro\`
    `);
    console.log('    ✅ trang_thai: OK');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('    ⏭️  Cột trang_thai đã tồn tại, bỏ qua');
    } else {
      throw err;
    }
  }

  console.log('\n');
  console.log('✅ ✅ ✅ MIGRATION HOÀN TẤT THÀNH CÔNG! ✅ ✅ ✅');
  console.log('');
  console.log('📊 Các thay đổi:');
  console.log('   • chu_tro: +email_verified, +verification_token, +verification_token_expiry');
  console.log('   • chu_tro: +phone_verified, +phone_verification_code, +phone_verification_expiry');
  console.log('   • hinh_anh_phong: +file_hash, +index');
  console.log('   • tai_khoan: +trang_thai (nếu chưa có)');
  console.log('');
  console.log('🚀 Bạn có thể khởi động server ngay bây giờ!');
  console.log('');

} catch (error) {
  console.error('\n❌ LỖI MIGRATION:');
  console.error(error.message);
  process.exit(1);
} finally {
  await connection.end();
}
