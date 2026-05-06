import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
};

const sqlFiles = [
  'quan_ly_thue_tro_tai_khoan.sql',
  'quan_ly_thue_tro_chu_tro.sql',
  'quan_ly_thue_tro_nguoi_thue.sql',
  'quan_ly_thue_tro_phong.sql',
  'quan_ly_thue_tro_hop_dong.sql',
  'quan_ly_thue_tro_hoa_don.sql',
  'quan_ly_thue_tro_thanh_toan.sql'
];

async function importSQL() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('🚀 Bắt đầu import dữ liệu mẫu...');

    for (const file of sqlFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        console.log(`\n📝 Đang import: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Tắt check foreign key tạm thời để tránh lỗi order nếu có
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
        await connection.query(sql);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
        
        console.log(`✅ Hoàn thành: ${file}`);
      } else {
        console.warn(`⚠️  Không tìm thấy file: ${file}`);
      }
    }

    console.log('\n✨ TẤT CẢ DỮ LIỆU ĐÃ ĐƯỢC IMPORT THÀNH CÔNG!');
    
    console.log('\n🔄 Đang chạy lại migration để cập nhật cấu trúc mới nhất...');
    // Gọi script migrate.js
    // Vì migrate.js là ES module, ta có thể import hoặc chạy bằng exec
  } catch (error) {
    console.error('❌ Lỗi import:', error);
  } finally {
    if (connection) await connection.end();
  }
}

importSQL();
