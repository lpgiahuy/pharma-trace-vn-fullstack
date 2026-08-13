import pool from '../../config/db.js';

export const getSuppliersModel = async () => {
    const query = `
        SELECT id, ten_don_vi, loai_don_vi, dia_chi, toa_do_lat, toa_do_lng
        FROM public.donvi
        WHERE loai_don_vi IN ('NhaPhanPhoi', 'NhaMay')
        ORDER BY id DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
};

export const createSupplierModel = async ({ ten_don_vi, loai_don_vi = 'NhaPhanPhoi', dia_chi, toa_do_lat = null, toa_do_lng = null }) => {
    const query = `
        INSERT INTO public.donvi (ten_don_vi, loai_don_vi, dia_chi, toa_do_lat, toa_do_lng)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, ten_don_vi, loai_don_vi, dia_chi;
    `;
    const values = [ten_don_vi, loai_don_vi, dia_chi, toa_do_lat, toa_do_lng];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const getPurchaseOrdersModel = async (userContext = null) => {
    let whereClause = '';
    const params = [];
    const unitId = (userContext && userContext.role === 'SuperAdmin' && userContext.force_unit_id)
        ? Number(userContext.force_unit_id)
        : (userContext && userContext.role !== 'SuperAdmin' && userContext.don_vi_id ? Number(userContext.don_vi_id) : null);

    if (unitId) {
        whereClause = ' WHERE nv.don_vi_id = $1 OR pn.nha_cung_cap_id = $1';
        params.push(unitId);
    }

    const query = `
        SELECT 
            pn.id,
            pn.ma_phieu_nhap,
            pn.nha_cung_cap_id,
            dv.ten_don_vi AS ten_nha_cung_cap,
            pn.nguoi_tao_id,
            nv.ho_ten AS ten_nguoi_tao,
            pn.tong_tien,
            pn.trang_thai,
            pn.ghi_chu,
            pn.ngay_nhap,
            pn.created_at,
            COUNT(ct.id)::int AS so_luong_mat_hang
        FROM public.phieunhap pn
        LEFT JOIN public.donvi dv ON pn.nha_cung_cap_id = dv.id
        LEFT JOIN public.nhanvien nv ON pn.nguoi_tao_id = nv.id
        LEFT JOIN public.chitietphieunhap ct ON pn.id = ct.phieu_nhap_id
        ${whereClause}
        GROUP BY pn.id, dv.ten_don_vi, nv.ho_ten
        ORDER BY pn.created_at DESC;
    `;
    const { rows } = await pool.query(query, params);
    return rows;
};

export const getPurchaseOrderByIdModel = async (id) => {
    const poQuery = `
        SELECT 
            pn.id,
            pn.ma_phieu_nhap,
            pn.nha_cung_cap_id,
            dv.ten_don_vi AS ten_nha_cung_cap,
            pn.nguoi_tao_id,
            nv.ho_ten AS ten_nguoi_tao,
            pn.tong_tien,
            pn.trang_thai,
            pn.ghi_chu,
            pn.ngay_nhap,
            pn.created_at
        FROM public.phieunhap pn
        LEFT JOIN public.donvi dv ON pn.nha_cung_cap_id = dv.id
        LEFT JOIN public.nhanvien nv ON pn.nguoi_tao_id = nv.id
        WHERE pn.id = $1;
    `;
    const itemsQuery = `
        SELECT 
            ct.id,
            ct.duoc_pham_id,
            dp.ten_thuoc,
            ct.lo_thuoc_id,
            lt.so_lo,
            lt.han_su_dung,
            ct.quy_cach_id,
            qc.ten_don_vi AS ten_quy_cach,
            ct.so_luong,
            ct.don_gia,
            ct.thanh_tien
        FROM public.chitietphieunhap ct
        LEFT JOIN public.duocpham dp ON ct.duoc_pham_id = dp.id
        LEFT JOIN public.lothuoc lt ON ct.lo_thuoc_id = lt.id
        LEFT JOIN public.quycachdonggoi qc ON ct.quy_cach_id = qc.id
        WHERE ct.phieu_nhap_id = $1;
    `;

    const poResult = await pool.query(poQuery, [id]);
    if (poResult.rows.length === 0) return null;

    const itemsResult = await pool.query(itemsQuery, [id]);
    return {
        ...poResult.rows[0],
        chi_tiet: itemsResult.rows
    };
};

export const createPurchaseOrderModel = async ({ nha_cung_cap_id, nguoi_tao_id, ghi_chu, items }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const ma_phieu_nhap = `PO-${Date.now().toString().slice(-8)}`;
        let tong_tien = 0;
        items.forEach(item => {
            tong_tien += Number(item.so_luong) * Number(item.don_gia);
        });

        const insertPoQuery = `
            INSERT INTO public.phieunhap (ma_phieu_nhap, nha_cung_cap_id, nguoi_tao_id, tong_tien, trang_thai, ghi_chu)
            VALUES ($1, $2, $3, $4, 'ChoDuyet', $5)
            RETURNING id, ma_phieu_nhap, tong_tien, trang_thai, created_at;
        `;
        const poRes = await client.query(insertPoQuery, [ma_phieu_nhap, nha_cung_cap_id, nguoi_tao_id || null, tong_tien, ghi_chu || '']);
        const poId = poRes.rows[0].id;

        for (const item of items) {
            const insertItemQuery = `
                INSERT INTO public.chitietphieunhap (phieu_nhap_id, duoc_pham_id, lo_thuoc_id, quy_cach_id, so_luong, don_gia)
                VALUES ($1, $2, $3, $4, $5, $6);
            `;
            await client.query(insertItemQuery, [
                poId,
                item.duoc_pham_id,
                item.lo_thuoc_id || null,
                item.quy_cach_id || null,
                item.so_luong,
                item.don_gia
            ]);
        }

        await client.query('COMMIT');
        return poRes.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const updatePurchaseOrderStatusModel = async (id, trang_thai) => {
    const query = `
        UPDATE public.phieunhap
        SET trang_thai = $1
        WHERE id = $2
        RETURNING id, ma_phieu_nhap, trang_thai;
    `;
    const { rows } = await pool.query(query, [trang_thai, id]);
    return rows[0];
};
