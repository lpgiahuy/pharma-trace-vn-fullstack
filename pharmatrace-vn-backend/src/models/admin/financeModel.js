import pool from '../../config/db.js';

/**
 * Lấy số liệu thống kê tài chính KPI (Doanh thu, Chi phí, Công nợ AR/AP, Dòng tiền)
 */
export const getFinanceStatsModel = async () => {
    const client = await pool.connect();
    try {
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

        // 1. Tổng tiền Thu & Tổng tiền Chi trong Sổ quỹ
        const cashbookRes = await client.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN loai_phieu = 'Thu' THEN so_tien ELSE 0 END), 0) AS tong_thu,
                COALESCE(SUM(CASE WHEN loai_phieu = 'Chi' THEN so_tien ELSE 0 END), 0) AS tong_chi
            FROM public.so_quy_thu_chi
        `);

        // 2. Tổng công nợ Phải Thu Khách Hàng (AR)
        const arRes = await client.query(`
            SELECT 
                COALESCE(SUM(tong_tien_no), 0) AS tong_ar_no,
                COALESCE(SUM(da_thanh_toan), 0) AS tong_ar_da_thu,
                COALESCE(SUM(con_no), 0) AS tong_ar_con_no
            FROM public.cong_no_khach_hang
        `);

        // 3. Tổng công nợ Phải Trả Nhà Cung Cấp (AP)
        const apRes = await client.query(`
            SELECT 
                COALESCE(SUM(tong_tien_no), 0) AS tong_ap_no,
                COALESCE(SUM(da_thanh_toan), 0) AS tong_ap_da_tra,
                COALESCE(SUM(con_no), 0) AS tong_ap_con_no
            FROM public.cong_no_nha_cung_cap
        `);

        const tongThu = parseFloat(cashbookRes.rows[0].tong_thu);
        const tongChi = parseFloat(cashbookRes.rows[0].tong_chi);
        const dongTienRong = tongThu - tongChi;

        return {
            tong_thu: tongThu,
            tong_chi: tongChi,
            dong_tien_rong: dongTienRong,
            ar: {
                tong_no: parseFloat(arRes.rows[0].tong_ar_no),
                da_thu: parseFloat(arRes.rows[0].tong_ar_da_thu),
                con_no: parseFloat(arRes.rows[0].tong_ar_con_no)
            },
            ap: {
                tong_no: parseFloat(apRes.rows[0].tong_ap_no),
                da_tra: parseFloat(apRes.rows[0].tong_ap_da_tra),
                con_no: parseFloat(apRes.rows[0].tong_ap_con_no)
            }
        };
    } finally {
        client.release();
    }
};

/**
 * Danh sách Nhật ký Sổ Quỹ Thu / Chi
 */
export const getCashbookModel = async ({ type, search } = {}) => {
    const client = await pool.connect();
    try {
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
        let query = `
            SELECT 
                sq.id,
                sq.ma_phieu,
                sq.loai_phieu,
                sq.loai_giao_dich,
                sq.so_tien,
                sq.doi_tuong_loai,
                sq.doi_tuong_ten,
                sq.don_hang_id,
                sq.don_nhap_id,
                sq.phuong_thuc,
                sq.ghi_chu,
                sq.ngay_giao_dich
            FROM public.so_quy_thu_chi sq
            WHERE 1=1
        `;
        const params = [];

        if (type) {
            params.push(type);
            query += ` AND sq.loai_phieu = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (sq.ma_phieu ILIKE $${params.length} OR sq.doi_tuong_ten ILIKE $${params.length} OR sq.ghi_chu ILIKE $${params.length})`;
        }

        query += ` ORDER BY sq.ngay_giao_dich DESC`;

        const res = await client.query(query, params);
        return res.rows;
    } finally {
        client.release();
    }
};

/**
 * Lập phiếu Thu / Chi mới
 */
export const createCashbookModel = async ({ loai_phieu, loai_giao_dich, so_tien, doi_tuong_loai, doi_tuong_ten, don_hang_id, don_nhap_id, phuong_thuc, ghi_chu, created_by }) => {
    const client = await pool.connect();
    try {
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
        
        // Sinh mã phiếu thu chi tự động
        const prefix = loai_phieu === 'Thu' ? 'PT' : 'PC';
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(100 + Math.random() * 900);
        const maPhieu = `${prefix}-${dateStr}-${randomNum}`;

        const res = await client.query(`
            INSERT INTO public.so_quy_thu_chi (
                ma_phieu, loai_phieu, loai_giao_dich, so_tien, doi_tuong_loai, doi_tuong_ten, don_hang_id, don_nhap_id, phuong_thuc, ghi_chu, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [maPhieu, loai_phieu, loai_giao_dich, so_tien, doi_tuong_loai || 'Khac', doi_tuong_ten, don_hang_id || null, don_nhap_id || null, phuong_thuc || 'ChuyenKhoan', ghi_chu, created_by || null]);

        return res.rows[0];
    } finally {
        client.release();
    }
};

/**
 * Lấy danh sách Công nợ Phải Thu Khách Hàng (AR)
 */
export const getArModel = async ({ status, search } = {}) => {
    const client = await pool.connect();
    try {
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
        let query = `
            SELECT 
                ar.id,
                ar.khach_hang_id,
                kh.ho_ten AS ten_khach_hang,
                kh.so_dien_thoai,
                ar.don_hang_id,
                ar.tong_tien_no,
                ar.da_thanh_toan,
                ar.con_no,
                ar.han_thanh_toan,
                ar.trang_thai,
                ar.created_at
            FROM public.cong_no_khach_hang ar
            JOIN public.khachhang kh ON ar.khach_hang_id = kh.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND ar.trang_thai = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (kh.ho_ten ILIKE $${params.length} OR kh.so_dien_thoai ILIKE $${params.length})`;
        }

        query += ` ORDER BY ar.created_at DESC`;

        const res = await client.query(query, params);
        return res.rows;
    } finally {
        client.release();
    }
};

/**
 * Ghi nhận thu nợ Khách Hàng (AR)
 */
export const payArDebtModel = async (id, amount, note) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

        // 1. Kiểm tra khoản nợ hiện tại
        const arRes = await client.query(`SELECT * FROM public.cong_no_khach_hang WHERE id = $1 FOR UPDATE`, [id]);
        if (arRes.rows.length === 0) {
            throw new Error('Khoản công nợ khách hàng không tồn tại');
        }
        const ar = arRes.rows[0];
        const conNoHienTai = parseFloat(ar.con_no);
        const daThanhToanMoi = parseFloat(ar.da_thanh_toan) + amount;

        if (amount > conNoHienTai) {
            throw new Error(`Số tiền thu (${amount.toLocaleString()} ₫) vượt quá số nợ còn lại (${conNoHienTai.toLocaleString()} ₫)`);
        }

        let newStatus = 'ThanhToanMotPhan';
        if (daThanhToanMoi >= parseFloat(ar.tong_tien_no)) {
            newStatus = 'DaThanhToan';
        }

        // 2. Cập nhật bảng công nợ
        const updatedArRes = await client.query(`
            UPDATE public.cong_no_khach_hang
            SET da_thanh_toan = $1, trang_thai = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [daThanhToanMoi, newStatus, id]);

        // 3. Tự động lập Phiếu Thu vào Sổ Quỹ
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(100 + Math.random() * 900);
        const maPhieu = `PT-${dateStr}-${randomNum}`;

        await client.query(`
            INSERT INTO public.so_quy_thu_chi (
                ma_phieu, loai_phieu, loai_giao_dich, so_tien, doi_tuong_loai, doi_tuong_ten, don_hang_id, phuong_thuc, ghi_chu
            ) VALUES ($1, 'Thu', 'ThuTienCongNoKhach', $2, 'KhachHang', $3, $4, 'ChuyenKhoan', $5)
        `, [maPhieu, amount, `Khách hàng ID ${ar.khach_hang_id}`, ar.don_hang_id, note || `Thu tiền nợ đơn hàng #${ar.don_hang_id}`]);

        await client.query('COMMIT');
        return updatedArRes.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Lấy danh sách Công nợ Phải Trả Nhà Cung Cấp (AP)
 */
export const getApModel = async ({ status, search } = {}) => {
    const client = await pool.connect();
    try {
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
        let query = `
            SELECT 
                ap.id,
                ap.nha_cung_cap_ten,
                ap.don_nhap_id,
                ap.tong_tien_no,
                ap.da_thanh_toan,
                ap.con_no,
                ap.han_thanh_toan,
                ap.trang_thai,
                ap.created_at
            FROM public.cong_no_nha_cung_cap ap
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND ap.trang_thai = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND ap.nha_cung_cap_ten ILIKE $${params.length}`;
        }

        query += ` ORDER BY ap.created_at DESC`;

        const res = await client.query(query, params);
        return res.rows;
    } finally {
        client.release();
    }
};

/**
 * Ghi nhận trả nợ Nhà Cung Cấp (AP)
 */
export const payApDebtModel = async (id, amount, note) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

        // 1. Kiểm tra khoản nợ hiện tại
        const apRes = await client.query(`SELECT * FROM public.cong_no_nha_cung_cap WHERE id = $1 FOR UPDATE`, [id]);
        if (apRes.rows.length === 0) {
            throw new Error('Khoản công nợ nhà cung cấp không tồn tại');
        }
        const ap = apRes.rows[0];
        const conNoHienTai = parseFloat(ap.con_no);
        const daThanhToanMoi = parseFloat(ap.da_thanh_toan) + amount;

        if (amount > conNoHienTai) {
            throw new Error(`Số tiền chi trả (${amount.toLocaleString()} ₫) vượt quá số nợ còn lại (${conNoHienTai.toLocaleString()} ₫)`);
        }

        let newStatus = 'ThanhToanMotPhan';
        if (daThanhToanMoi >= parseFloat(ap.tong_tien_no)) {
            newStatus = 'DaThanhToan';
        }

        // 2. Cập nhật bảng công nợ NCC
        const updatedApRes = await client.query(`
            UPDATE public.cong_no_nha_cung_cap
            SET da_thanh_toan = $1, trang_thai = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [daThanhToanMoi, newStatus, id]);

        // 3. Tự động lập Phiếu Chi vào Sổ Quỹ
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(100 + Math.random() * 900);
        const maPhieu = `PC-${dateStr}-${randomNum}`;

        await client.query(`
            INSERT INTO public.so_quy_thu_chi (
                ma_phieu, loai_phieu, loai_giao_dich, so_tien, doi_tuong_loai, doi_tuong_ten, don_nhap_id, phuong_thuc, ghi_chu
            ) VALUES ($1, 'Chi', 'ChiTienNhapHangNCC', $2, 'NhaCungCap', $3, $4, 'ChuyenKhoan', $5)
        `, [maPhieu, amount, ap.nha_cung_cap_ten, ap.don_nhap_id, note || `Chi thanh toán nợ NCC ${ap.nha_cung_cap_ten}`]);

        await client.query('COMMIT');
        return updatedApRes.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
