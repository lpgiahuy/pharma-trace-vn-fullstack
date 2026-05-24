import cron from 'node-cron';
import pool from '../config/db.js';

// Hàm gánh vác việc gọi 3 Stored Procedures dưới Database
const runBatchProcessing = async () => {
    console.log('\n⏳ [CRON JOB] Đang khởi chạy trình dọn dẹp hệ thống (Batch Processing)...');
    try {
        // 1. Cập nhật lô thuốc hết hạn sang trạng thái 'HetHan'
        await pool.query('CALL sp_cap_nhat_lo_het_han()');
        console.log('   ✅ Đã quét và cập nhật trạng thái thuốc hết hạn.');

        // 2. Hủy các đơn hàng treo (Chưa thanh toán) quá 3 ngày
        await pool.query('CALL sp_huy_don_qua_han()');
        console.log('   ✅ Đã dọn dẹp các đơn hàng quá hạn thanh toán.');

        // 3. Xác nhận hoàn tất đơn ChoHoanTat quá 7 ngày: chuyển sang HoanThanh + cộng điểm tích lũy
        // (Việc cộng diem_tich_luy_tong sẽ kích hoạt trigger trg_auto_upgrade_tier để nâng hạng)
        await pool.query('CALL sp_xac_nhan_hoan_tat_sau_7_ngay()');
        console.log('   ✅ Đã xác nhận hoàn tất đơn hàng quá 7 ngày và cộng điểm tích lũy.');

        console.log('🎉 [CRON JOB] Hoàn tất dọn dẹp hệ thống thành công!\n');
    } catch (error) {
        console.error('❌ [CRON JOB] Có lỗi xảy ra trong quá trình chạy ngầm:', error.message);
    }
};

// Hàm kích hoạt bộ đếm thời gian
export const startCronJobs = () => {
    // Cú pháp '0 0 * * *' nghĩa là: Chạy vào lúc 00:00 (Nửa đêm) mỗi ngày
    // MẸO: Nếu bạn muốn test ngay bây giờ, hãy đổi thành '* * * * *' (Chạy mỗi 1 phút)
    cron.schedule('0 0 * * *', () => {
        runBatchProcessing();
    }, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh" // Set chuẩn giờ Việt Nam
    });
    
    console.log('🕒 Hệ thống Cron Job đã được kích hoạt (Lịch trình: 00:00 mỗi ngày).');
};