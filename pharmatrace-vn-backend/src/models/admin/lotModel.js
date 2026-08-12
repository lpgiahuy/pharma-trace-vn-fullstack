import pool from '../../config/db.js';

export const getLotsModel = async ({ status, search } = {}) => {
    let query = `
        SELECT 
            id,
            so_lo,
            duoc_pham_id,
            ten_thuoc,
            quy_cach_id,
            ten_quy_cach,
            ngay_san_xuat,
            han_su_dung,
            ngay_con_han,
            trang_thai_goc,
            trang_thai_hsd
        FROM public.view_quan_ly_lo_thuoc
        WHERE 1=1
    `;
    const params = [];

    if (status) {
        params.push(status);
        query += ` AND trang_thai_hsd = $${params.length}`;
    }

    if (search) {
        params.push(`%${search}%`);
        query += ` AND (so_lo ILIKE $${params.length} OR ten_thuoc ILIKE $${params.length})`;
    }

    query += ` ORDER BY ngay_con_han ASC;`; // FEFO: First Expired First Out

    const { rows } = await pool.query(query, params);
    return rows;
};

export const getLotStatsModel = async () => {
    const query = `
        SELECT 
            COUNT(*)::int AS tong_so_lo,
            COUNT(CASE WHEN trang_thai_hsd = 'CanDate' THEN 1 END)::int AS lo_can_date,
            COUNT(CASE WHEN trang_thai_hsd = 'HetHan' THEN 1 END)::int AS lo_het_han,
            COUNT(CASE WHEN trang_thai_hsd = 'ThuHoi' THEN 1 END)::int AS lo_thu_hoi
        FROM public.view_quan_ly_lo_thuoc;
    `;
    const { rows } = await pool.query(query);
    return rows[0];
};

export const createLotModel = async ({ duoc_pham_id, so_lo, ngay_san_xuat, han_su_dung, quy_cach_id = null }) => {
    const query = `
        INSERT INTO public.lothuoc (duoc_pham_id, so_lo, ngay_san_xuat, han_su_dung, quy_cach_id, trang_thai)
        VALUES ($1, $2, $3, $4, $5, 'HopLe')
        RETURNING id, so_lo, duoc_pham_id, ngay_san_xuat, han_su_dung, trang_thai;
    `;
    const values = [duoc_pham_id, so_lo, ngay_san_xuat, han_su_dung, quy_cach_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const recallLotModel = async (id) => {
    const query = `
        UPDATE public.lothuoc
        SET trang_thai = 'ThuHoi'
        WHERE id = $1
        RETURNING id, so_lo, trang_thai;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};
