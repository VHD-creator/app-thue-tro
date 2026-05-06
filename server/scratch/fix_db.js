import sequelize from '../config/database.js';

async function fix() {
  try {
    console.log('--- Đang kiểm tra và cập nhật Database ---');
    
    // Thêm cột verification_status vào bảng chu_tro
    await sequelize.query(`
      ALTER TABLE chu_tro 
      ADD COLUMN IF NOT EXISTS verification_status INT DEFAULT 0 
      COMMENT '0: Chưa gửi, 1: Chờ, 2: Xong, 3: Từ chối'
    `).catch(err => console.log('Cột verification_status có thể đã tồn tại hoặc có lỗi:', err.message));

    console.log('✅ Hoàn tất cập nhật cấu trúc bảng.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

fix();
