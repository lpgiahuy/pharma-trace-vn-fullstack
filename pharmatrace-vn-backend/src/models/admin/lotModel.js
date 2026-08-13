import pool from '../../config/db.js';
import { getCurrentUserContext } from '../../utils/userContext.js';

export const getLotsModel = async ({ status, search } = {}) => {
    const userContext = getCurrentUserContext();
    const unitId = (userContext && ['SuperAdmin', 'superadmin'].includes(userContext.role) && userContext.force_unit_id)
        ? Number(userContext.force_unit_id)
        : (userContext && !['SuperAdmin', 'superadmin'].includes(userContext.role) && userContext.don_vi_id ? Number(userContext.don_vi_id) : null);

    let query = `
        SELECT 
            v.id,
            v.so_lo,
            v.duoc_pham_id,
            v.ten_thuoc,
            v.quy_cach_id,
            v.ten_quy_cach,
            v.ngay_san_xuat,
            v.han_su_dung,
            v.ngay_con_han,
            v.trang_thai_goc,
            v.trang_thai_hsd
        FROM public.view_quan_ly_lo_thuoc v
        WHERE 1=1
    `;
    const params = [];

    if (unitId) {
        params.push(unitId);
        query += ` AND (
            EXISTS (SELECT 1 FROM public.TonKho tk WHERE tk.duoc_pham_id = v.duoc_pham_id AND tk.don_vi_id = $${params.length})
            OR EXISTS (SELECT 1 FROM public.hopthuoc ht WHERE ht.lo_thuoc_id = v.id AND ht.don_vi_hien_tai_id = $${params.length})
        )`;
    }

    if (status) {
        params.push(status);
        query += ` AND v.trang_thai_hsd = $${params.length}`;
    }

    if (search) {
        params.push(`%${search}%`);
        query += ` AND (v.so_lo ILIKE $${params.length} OR v.ten_thuoc ILIKE $${params.length})`;
    }

    query += ` ORDER BY v.ngay_con_han ASC;`; // FEFO: First Expired First Out

    const { rows } = await pool.query(query, params);
    return rows;
};

export const getLotStatsModel = async () => {
    const userContext = getCurrentUserContext();
    const unitId = (userContext && ['SuperAdmin', 'superadmin'].includes(userContext.role) && userContext.force_unit_id)
        ? Number(userContext.force_unit_id)
        : (userContext && !['SuperAdmin', 'superadmin'].includes(userContext.role) && userContext.don_vi_id ? Number(userContext.don_vi_id) : null);

    let query = `
        SELECT 
            COUNT(*)::int AS tong_so_lo,
            COUNT(CASE WHEN v.trang_thai_hsd = 'CanDate' THEN 1 END)::int AS lo_can_date,
            COUNT(CASE WHEN v.trang_thai_hsd = 'HetHan' THEN 1 END)::int AS lo_het_han,
            COUNT(CASE WHEN v.trang_thai_hsd = 'ThuHoi' THEN 1 END)::int AS lo_thu_hoi
        FROM public.view_quan_ly_lo_thuoc v
        WHERE 1=1
    `;
    const params = [];

    if (unitId) {
        params.push(unitId);
        query += ` AND (
            EXISTS (SELECT 1 FROM public.TonKho tk WHERE tk.duoc_pham_id = v.duoc_pham_id AND tk.don_vi_id = $1)
            OR EXISTS (SELECT 1 FROM public.hopthuoc ht WHERE ht.lo_thuoc_id = v.id AND ht.don_vi_hien_tai_id = $1)
        )`;
    }

    const { rows } = await pool.query(query, params);
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
