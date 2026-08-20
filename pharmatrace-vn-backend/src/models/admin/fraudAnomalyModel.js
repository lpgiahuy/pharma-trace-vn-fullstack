import pool from '../../config/db.js';

export const getFraudAlertsModel = async ({ riskLevel, alertType, status, search } = {}) => {
    let query = `
        SELECT 
            cb.id,
            cb.nhatky_id,
            cb.hop_thuoc_uid,
            cb.loai_canh_bao,
            cb.muc_do_rui_ro,
            cb.mo_ta,
            cb.toa_do_lat_truoc,
            cb.toa_do_lng_truoc,
            cb.toa_do_lat_sau,
            cb.toa_do_lng_sau,
            cb.khoang_cach_km,
            cb.thoi_gian_chenh_phut,
            cb.van_toc_kmh,
            cb.trang_thai,
            cb.ngay_tao,
            lt.so_lo AS so_lo_san_xuat,
            dp.ten_thuoc AS ten_duoc_pham
        FROM public.canhbao_gianlan cb
        LEFT JOIN public.hopthuoc ht ON cb.hop_thuoc_uid = ht.uid
        LEFT JOIN public.lothuoc lt ON ht.lo_thuoc_id = lt.id
        LEFT JOIN public.duocpham dp ON lt.duoc_pham_id = dp.id
        WHERE 1=1
    `;
    const params = [];

    if (riskLevel) {
        params.push(riskLevel);
        query += ` AND cb.muc_do_rui_ro = $${params.length}`;
    }

    if (alertType) {
        params.push(alertType);
        query += ` AND cb.loai_canh_bao = $${params.length}`;
    }

    if (status) {
        params.push(status);
        query += ` AND cb.trang_thai = $${params.length}`;
    }

    if (search) {
        params.push(`%${search}%`);
        query += ` AND (cb.hop_thuoc_uid::text ILIKE $${params.length} OR cb.mo_ta ILIKE $${params.length} OR dp.ten_thuoc ILIKE $${params.length})`;
    }

    query += ` ORDER BY cb.ngay_tao DESC;`;

    const { rows } = await pool.query(query, params);
    return rows;
};

export const getFraudStatsModel = async () => {
    const query = `
        SELECT 
            COUNT(*)::int AS tong_so_canh_bao,
            COUNT(CASE WHEN muc_do_rui_ro = 'Critical' THEN 1 END)::int AS rui_ro_nghiem_trong,
            COUNT(CASE WHEN loai_canh_bao = 'VelocityAnomaly' THEN 1 END)::int AS bat_thuong_van_toc,
            COUNT(CASE WHEN loai_canh_bao = 'FrequencyAnomaly' THEN 1 END)::int AS bat_thuong_tan_suat,
            COUNT(CASE WHEN trang_thai = 'BaoDongGia' THEN 1 END)::int AS da_xac_nhan_hang_gia
        FROM public.canhbao_gianlan;
    `;
    const { rows } = await pool.query(query);
    return rows[0];
};

export const updateAlertStatusModel = async (id, status) => {
    const query = `
        UPDATE public.canhbao_gianlan
        SET trang_thai = $1
        WHERE id = $2
        RETURNING id, hop_thuoc_uid, loai_canh_bao, trang_thai;
    `;
    const { rows } = await pool.query(query, [status, id]);
    return rows[0];
};

export const simulateScanEngineModel = async ({ hop_thuoc_uid, lat, lng, ip_address = '127.0.0.1' }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 0. Đảm bảo UID tồn tại trong bảng hopthuoc (tránh lỗi Foreign Key constraint khi test)
        await client.query(`
            INSERT INTO public.hopthuoc (uid, trang_thai)
            VALUES ($1::uuid, 'TrongKho')
            ON CONFLICT (uid) DO NOTHING;
        `, [hop_thuoc_uid]);

        // 1. Tìm nhật ký quét gần nhất của cùng UID
        const lastScanQuery = `
            SELECT id, thoi_gian_quet, toa_do_lat, toa_do_lng, ip_address
            FROM public.nhatkyxacthuc
            WHERE hop_thuoc_uid = $1
            ORDER BY thoi_gian_quet DESC
            LIMIT 1;
        `;
        const lastScanRes = await client.query(lastScanQuery, [hop_thuoc_uid]);
        const lastScan = lastScanRes.rows[0];

        // 2. Chèn lượt quét mới vào nhatkyxacthuc
        const insertScanQuery = `
            INSERT INTO public.nhatkyxacthuc (hop_thuoc_uid, toa_do_lat, toa_do_lng, ip_address, trang_thai_canh_bao)
            VALUES ($1, $2, $3, $4, false)
            RETURNING id, thoi_gian_quet;
        `;
        const currentScanRes = await client.query(insertScanQuery, [hop_thuoc_uid, lat, lng, ip_address]);
        const currentScan = currentScanRes.rows[0];

        let anomalyDetected = false;
        let createdAlert = null;
        let distance_km = 0;
        let time_diff_minutes = 0;
        let speed_kmh = 0;

        if (lastScan && lastScan.toa_do_lat && lastScan.toa_do_lng) {
            // 3. Tính khoảng cách Haversine
            const distRes = await client.query(
                `SELECT public.fn_haversine_distance($1, $2, $3, $4) AS dist;`,
                [lastScan.toa_do_lat, lastScan.toa_do_lng, lat, lng]
            );
            distance_km = Number(distRes.rows[0].dist);

            // Tính thời gian chênh lệch (phút)
            const tPrev = new Date(lastScan.thoi_gian_quet).getTime();
            const tCurr = new Date(currentScan.thoi_gian_quet).getTime();
            time_diff_minutes = Math.max(0.1, (tCurr - tPrev) / (1000 * 60)); // tối thiểu 0.1 phút để tránh chia cho 0

            // Tính vận tốc di chuyển ước tính (km/h)
            speed_kmh = Number((distance_km / (time_diff_minutes / 60)).toFixed(2));

            // Quy tắc phát hiện gian lận Velocity Anomaly: Vận tốc > 150 km/h và Khoảng cách > 20 km trong vòng 60 phút
            if (speed_kmh > 150 && distance_km > 20 && time_diff_minutes <= 120) {
                anomalyDetected = true;
                const riskLevel = speed_kmh > 1000 ? 'Critical' : 'High';
                const description = `Engine Cảnh báo Vận tốc: Phát hiện mã QR quét tại 2 vị trí cách nhau ${distance_km} km chỉ trong ${time_diff_minutes.toFixed(1)} phút (Vận tốc ước tính ${speed_kmh} km/h). Nghi vấn giả mạo / nhân bản mã QR!`;

                const insertAlertQuery = `
                    INSERT INTO public.canhbao_gianlan (
                        nhatky_id, hop_thuoc_uid, loai_canh_bao, muc_do_rui_ro, mo_ta,
                        toa_do_lat_truoc, toa_do_lng_truoc, toa_do_lat_sau, toa_do_lng_sau,
                        khoang_cach_km, thoi_gian_chenh_phut, van_toc_kmh, trang_thai
                    ) VALUES ($1, $2, 'VelocityAnomaly', $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Moi')
                    RETURNING *;
                `;
                const alertRes = await client.query(insertAlertQuery, [
                    currentScan.id, hop_thuoc_uid, riskLevel, description,
                    lastScan.toa_do_lat, lastScan.toa_do_lng, lat, lng,
                    distance_km, time_diff_minutes, speed_kmh
                ]);
                createdAlert = alertRes.rows[0];

                // Đánh dấu trang_thai_canh_bao trong nhatkyxacthuc
                await client.query(`UPDATE public.nhatkyxacthuc SET trang_thai_canh_bao = true WHERE id = $1;`, [currentScan.id]);
            }
        }

        await client.query('COMMIT');

        return {
            anomalyDetected,
            createdAlert,
            distance_km,
            time_diff_minutes,
            speed_kmh,
            scan: currentScan
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
