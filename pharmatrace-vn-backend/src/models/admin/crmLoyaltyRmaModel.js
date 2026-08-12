import pool from '../../config/db.js';

export const getCustomersCrmModel = async ({ rank, search } = {}) => {
    let query = `
        SELECT 
            kh.id,
            kh.ho_ten,
            kh.so_dien_thoai,
            kh.email,
            kh.dia_chi_mac_dinh,
            kh.diem_tich_luy,
            kh.diem_tich_luy_tong,
            kh.hang_thanh_vien,
            kh.ngay_tao,
            COUNT(dh.id)::int AS tong_don_hang,
            COALESCE(SUM(dh.tong_tien), 0)::numeric(12,2) AS tong_chi_tieu
        FROM public.khachhang kh
        LEFT JOIN public.donhang dh ON kh.id = dh.khach_hang_id
        WHERE 1=1
    `;
    const params = [];

    if (rank) {
        params.push(rank);
        query += ` AND kh.hang_thanh_vien = $${params.length}`;
    }

    if (search) {
        params.push(`%${search}%`);
        query += ` AND (kh.ho_ten ILIKE $${params.length} OR kh.so_dien_thoai ILIKE $${params.length} OR kh.email ILIKE $${params.length})`;
    }

    query += ` GROUP BY kh.id ORDER BY kh.diem_tich_luy_tong DESC;`;

    const { rows } = await pool.query(query, params);
    return rows;
};

export const getCrmStatsModel = async () => {
    const query = `
        SELECT 
            COUNT(*)::int AS tong_khach_hang,
            COUNT(CASE WHEN hang_thanh_vien = 'Kim Cương' THEN 1 END)::int AS thanh_vien_kim_cuong,
            COUNT(CASE WHEN hang_thanh_vien = 'Bạch Kim' THEN 1 END)::int AS thanh_vien_bach_kim,
            COUNT(CASE WHEN hang_thanh_vien = 'Vàng' THEN 1 END)::int AS thanh_vien_vang,
            COALESCE(SUM(diem_tich_luy_tong), 0)::int AS tong_diem_da_cap,
            (SELECT COUNT(*)::int FROM public.phieutrahang WHERE trang_thai_duyet = 'ChoDuyet') AS rma_cho_duyet
        FROM public.khachhang;
    `;
    const { rows } = await pool.query(query);
    return rows[0];
};

export const getCustomerPointsHistoryModel = async (customerId) => {
    const query = `
        SELECT 
            ls.id,
            ls.khach_hang_id,
            ls.don_hang_id,
            ls.loai_giao_dich,
            ls.so_diem,
            ls.mo_ta,
            ls.ngay_tao
        FROM public.lichsu_tichdiem ls
        WHERE ls.khach_hang_id = $1
        ORDER BY ls.ngay_tao DESC;
    `;
    const { rows } = await pool.query(query, [customerId]);
    return rows;
};

export const adjustCustomerPointsModel = async ({ customer_id, points, type = 'DieuChinhAdmin', description = 'Điều chỉnh điểm từ Admin' }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Chèn vào lichsu_tichdiem
        const insertHistory = `
            INSERT INTO public.lichsu_tichdiem (khach_hang_id, loai_giao_dich, so_diem, mo_ta)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const historyRes = await client.query(insertHistory, [customer_id, type, points, description]);

        // 2. Cập nhật điểm tích lũy trong khachhang
        const updatePoints = `
            UPDATE public.khachhang
            SET diem_tich_luy = GREATEST(0, diem_tich_luy + $1),
                diem_tich_luy_tong = GREATEST(0, diem_tich_luy_tong + CASE WHEN $1 > 0 THEN $1 ELSE 0 END)
            WHERE id = $2
            RETURNING id, ho_ten, diem_tich_luy, diem_tich_luy_tong, hang_thanh_vien;
        `;
        const userRes = await client.query(updatePoints, [points, customer_id]);

        if (userRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        // 3. Chạy hàm cập nhật Rank tự động
        const rankRes = await client.query(`SELECT public.fn_update_customer_rank($1) AS new_rank;`, [customer_id]);
        userRes.rows[0].hang_thanh_vien = rankRes.rows[0].new_rank;

        await client.query('COMMIT');
        return {
            customer: userRes.rows[0],
            history: historyRes.rows[0]
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getRmaRequestsModel = async ({ status, search } = {}) => {
    const client = await pool.connect();
    try {
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
        let query = `
            SELECT 
                pth.id,
                pth.don_hang_id,
                pth.khach_hang_id,
                pth.ly_do_tra,
                pth.ngay_yeu_cau,
                pth.trang_thai_duyet,
                dh.tong_tien AS tong_tien_don_hang,
                dh.phuong_thuc_thanh_toan,
                kh.ho_ten AS ten_khach_hang,
                kh.so_dien_thoai
            FROM public.phieutrahang pth
            LEFT JOIN public.donhang dh ON pth.don_hang_id = dh.id
            LEFT JOIN public.khachhang kh ON pth.khach_hang_id = kh.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND pth.trang_thai_duyet = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (pth.ly_do_tra ILIKE $${params.length} OR kh.ho_ten ILIKE $${params.length} OR kh.so_dien_thoai ILIKE $${params.length})`;
        }

        query += ` ORDER BY pth.ngay_yeu_cau DESC;`;

        const { rows } = await client.query(query, params);
        return rows;
    } finally {
        client.release();
    }
};

export const updateRmaStatusModel = async (id, status) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const updateRmaQuery = `
            UPDATE public.phieutrahang
            SET trang_thai_duyet = $1
            WHERE id = $2
            RETURNING id, don_hang_id, khach_hang_id, trang_thai_duyet;
        `;
        const res = await client.query(updateRmaQuery, [status, id]);
        if (res.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        const rma = res.rows[0];

        // Nếu phê duyệt RMA hoặc hoàn tiền -> đồng bộ trang_thai_don = 'TraHang'
        if (status === 'DaDuyet' || status === 'DaHoanTien') {
            await client.query(`
                UPDATE public.donhang
                SET trang_thai_don = 'TraHang',
                    trang_thai_thanh_toan = CASE WHEN $1 = 'DaHoanTien' THEN 'HoanTien' ELSE trang_thai_thanh_toan END
                WHERE id = $2;
            `, [status, rma.don_hang_id]);
        }

        await client.query('COMMIT');
        return rma;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getRmaDetailModel = async (rmaId) => {
    const client = await pool.connect();
    try {
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
        // 1. Lấy thông tin phiếu trả hàng
        const rmaQuery = `
            SELECT 
                pth.id,
                pth.don_hang_id,
                pth.khach_hang_id,
                pth.ly_do_tra,
                pth.ngay_yeu_cau,
                pth.trang_thai_duyet,
                dh.tong_tien AS tong_tien_don_hang,
                dh.phuong_thuc_thanh_toan,
                kh.ho_ten AS ten_khach_hang,
                kh.so_dien_thoai,
                kh.email
            FROM public.phieutrahang pth
            LEFT JOIN public.donhang dh ON pth.don_hang_id = dh.id
            LEFT JOIN public.khachhang kh ON pth.khach_hang_id = kh.id
            WHERE pth.id = $1;
        `;
        const rmaRes = await client.query(rmaQuery, [rmaId]);
        if (rmaRes.rows.length === 0) return null;
        const rmaInfo = rmaRes.rows[0];

        // 2. Lấy danh sách sản phẩm chi tiết trả hàng
        const itemsQuery = `
            SELECT 
                ct.id,
                ct.phieu_tra_hang_id,
                ct.duoc_pham_id,
                ct.so_luong,
                dp.ten_thuoc AS ten_duoc_pham,
                dp.so_dang_ky AS ma_duoc_pham,
                COALESCE((SELECT MIN(gia_ban) FROM public.quycachdonggoi WHERE duoc_pham_id = dp.id), 50000)::numeric(12,2) AS gia_ban,
                (ct.so_luong * COALESCE((SELECT MIN(gia_ban) FROM public.quycachdonggoi WHERE duoc_pham_id = dp.id), 50000))::numeric(12,2) AS thanh_tien
            FROM public.chitietphieutrahang ct
            LEFT JOIN public.duocpham dp ON ct.duoc_pham_id = dp.id
            WHERE ct.phieu_tra_hang_id = $1;
        `;
        const itemsRes = await client.query(itemsQuery, [rmaId]);
        rmaInfo.items = itemsRes.rows;

        return rmaInfo;
    } finally {
        client.release();
    }
};
