import pool from '../../config/db.js';

export const getShipmentsModel = async ({ carrier, deliveryStatus, codStatus, search } = {}) => {
    let query = `
        SELECT 
            vc.id,
            vc.don_hang_id,
            vc.ma_van_don,
            vc.don_vi_van_chuyen,
            vc.trang_thai_giao,
            vc.tien_cod,
            vc.trang_thai_cod,
            vc.ngay_tao,
            vc.ngay_giao_thuc_te,
            dh.tong_tien AS tong_tien_don_hang,
            dh.phuong_thuc_thanh_toan,
            dh.dia_chi_giao_hang,
            kh.ho_ten AS ten_khach_hang,
            kh.so_dien_thoai
        FROM public.vanchuyen vc
        LEFT JOIN public.donhang dh ON vc.don_hang_id = dh.id
        LEFT JOIN public.khachhang kh ON dh.khach_hang_id = kh.id
        WHERE 1=1
    `;
    const params = [];

    if (carrier) {
        params.push(carrier);
        query += ` AND vc.don_vi_van_chuyen = $${params.length}`;
    }

    if (deliveryStatus) {
        params.push(deliveryStatus);
        query += ` AND vc.trang_thai_giao = $${params.length}`;
    }

    if (codStatus) {
        params.push(codStatus);
        query += ` AND vc.trang_thai_cod = $${params.length}`;
    }

    if (search) {
        params.push(`%${search}%`);
        query += ` AND (vc.ma_van_don ILIKE $${params.length} OR kh.ho_ten ILIKE $${params.length} OR kh.so_dien_thoai ILIKE $${params.length})`;
    }

    query += ` ORDER BY vc.ngay_tao DESC;`;

    const { rows } = await pool.query(query, params);
    return rows;
};

export const getCodSummaryModel = async () => {
    const query = `
        SELECT 
            COUNT(*)::int AS tong_so_van_don,
            COUNT(CASE WHEN trang_thai_giao IN ('ChoLayHang', 'DangVanChuyen') THEN 1 END)::int AS don_dang_giao,
            COALESCE(SUM(CASE WHEN trang_thai_cod = 'ChuaDoiSoat' THEN tien_cod ELSE 0 END), 0)::numeric(12,2) AS tong_cod_chua_doi_soat,
            COALESCE(SUM(CASE WHEN trang_thai_cod = 'DaDoiSoat' THEN tien_cod ELSE 0 END), 0)::numeric(12,2) AS tong_cod_da_doi_soat
        FROM public.vanchuyen;
    `;
    const { rows } = await pool.query(query);
    return rows[0];
};

export const createShipmentModel = async ({ don_hang_id, don_vi_van_chuyen = 'DoiXeNoiBo', tien_cod = 0 }) => {
    const ma_van_don = `SHIP-${don_hang_id}-${Math.floor(Math.random() * 89999 + 10000)}`;
    const query = `
        INSERT INTO public.vanchuyen (don_hang_id, ma_van_don, don_vi_van_chuyen, trang_thai_giao, tien_cod, trang_thai_cod)
        VALUES ($1, $2, $3, 'ChoLayHang', $4, 'ChuaDoiSoat')
        RETURNING id, don_hang_id, ma_van_don, don_vi_van_chuyen, trang_thai_giao, tien_cod, trang_thai_cod, ngay_tao;
    `;
    const values = [don_hang_id, ma_van_don, don_vi_van_chuyen, tien_cod];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const updateShipmentStatusModel = async (id, trang_thai_giao) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let updateShipmentQuery = `
            UPDATE public.vanchuyen
            SET trang_thai_giao = $1
        `;
        const params = [trang_thai_giao, id];

        if (trang_thai_giao === 'GiaoThanhCong') {
            updateShipmentQuery += `, ngay_giao_thuc_te = CURRENT_TIMESTAMP`;
        }

        updateShipmentQuery += ` WHERE id = $2 RETURNING id, don_hang_id, ma_van_don, trang_thai_giao;`;

        const shipRes = await client.query(updateShipmentQuery, params);
        if (shipRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        const shipment = shipRes.rows[0];

        // Tự động đồng bộ trạng thái đơn hàng khi Giao thành công
        if (trang_thai_giao === 'GiaoThanhCong') {
            await client.query(`
                UPDATE public.donhang
                SET trang_thai_don = 'HoanThanh',
                    trang_thai_thanh_toan = CASE 
                        WHEN phuong_thuc_thanh_toan = 'COD' THEN 'DaThanhToan' 
                        ELSE trang_thai_thanh_toan 
                    END
                WHERE id = $1;
            `, [shipment.don_hang_id]);
        } else if (trang_thai_giao === 'DangVanChuyen') {
            await client.query(`
                UPDATE public.donhang
                SET trang_thai_don = 'DangGiao'
                WHERE id = $1;
            `, [shipment.don_hang_id]);
        }

        await client.query('COMMIT');
        return shipment;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const reconcileCodModel = async (id) => {
    const query = `
        UPDATE public.vanchuyen
        SET trang_thai_cod = 'DaDoiSoat'
        WHERE id = $1
        RETURNING id, ma_van_don, tien_cod, trang_thai_cod;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};
