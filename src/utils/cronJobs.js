import cron from 'node-cron';
import pool from '../config/db.js';

// Calls 3 stored procedures in the database for scheduled maintenance
const runBatchProcessing = async () => {
    console.log('\n⏳ [CRON JOB] Starting system cleanup (Batch Processing)...');
    try {
        // 1. Mark expired medicine batches as 'HetHan'
        await pool.query('CALL sp_cap_nhat_lo_het_han()');
        console.log('   ✅ Scanned and updated expired medicine statuses.');

        // 2. Cancel pending orders (unpaid) older than 3 days
        await pool.query('CALL sp_huy_don_qua_han()');
        console.log('   ✅ Cleaned up overdue unpaid orders.');

        // 3. Auto-complete orders in 'ChoHoanTat' status older than 7 days: move to HoanThanh + add loyalty points
        // (Updating diem_tich_luy_tong triggers trg_auto_upgrade_tier to upgrade membership tier)
        await pool.query('CALL sp_xac_nhan_hoan_tat_sau_7_ngay()');
        console.log('   ✅ Auto-completed orders older than 7 days and credited loyalty points.');

        console.log('🎉 [CRON JOB] System cleanup completed successfully!\n');
    } catch (error) {
        console.error('❌ [CRON JOB] Error during background processing:', error.message);
    }
};

// Registers all scheduled cron jobs and starts the scheduler
export const startCronJobs = () => {
    // '0 0 * * *' means: run at 00:00 (midnight) every day
    // TIP: To test immediately, change to '* * * * *' (runs every 1 minute)
    cron.schedule('0 0 * * *', () => {
        runBatchProcessing();
    }, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh" // Vietnam timezone
    });

    console.log('🕒 Cron Job system activated (Schedule: 00:00 daily).');
};