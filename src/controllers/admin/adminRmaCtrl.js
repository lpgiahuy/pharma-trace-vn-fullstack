import * as adminRmaModel from '../../models/admin/adminRmaModel.js';
import pool from '../../config/db.js';

const getRmaList = async (req, res, next) => {
    try {
        const data = await adminRmaModel.getAllRmaRequests();
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const approveRma = async (req, res, next) => {
    try {
        const { trang_thai_duyet } = req.body; 
        const rmaId = req.params.id;

        // get current status from DB to validate the update request
        const checkExisting = await pool.query(
            `SELECT trang_thai_duyet FROM PhieuTraHang WHERE id = $1`, 
            [rmaId]
        );

        // check if the RMA request exists
        if (checkExisting.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu yêu cầu trả hàng này!' });
        }

        const currentStatus = checkExisting.rows[0].trang_thai_duyet;

        // prevent redundant updates
        if (currentStatus === trang_thai_duyet) {
            return res.status(400).json({ 
                success: false, 
                message: `Phiếu này hiện tại đã ở trạng thái "${currentStatus}" rồi!` 
            });
        }

        // business rule: once a request is marked as refunded or rejected, it cannot be changed anymore
        if (currentStatus === 'DaHoanTien' || currentStatus === 'TuChoi') {
            return res.status(400).json({ 
                success: false, 
                message: `Phiếu này đã chốt hồ sơ (${currentStatus}), bạn không thể thay đổi trạng thái được nữa!` 
            });
        }

        // business rule: cannot revert a "DaDuyet" back to "ChoDuyet"
        if (currentStatus === 'DaDuyet' && trang_thai_duyet === 'ChoDuyet') {
            return res.status(400).json({ 
                success: false, 
                message: `Không thể đưa phiếu đã duyệt quay trở lại trạng thái "Chờ duyệt"!` 
            });
        }

        // update the status in the database
        const data = await adminRmaModel.updateRmaStatus(rmaId, trang_thai_duyet);
        
        res.status(200).json({ 
            success: true, 
            message: `Return request status updated: ${trang_thai_duyet}`, 
            data 
        });
    } catch (error) { 
        if (error.statusCode) res.status(error.statusCode);
        next(error); 
    }
};

export { getRmaList, approveRma };