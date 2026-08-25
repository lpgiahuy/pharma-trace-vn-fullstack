import {
    getShipmentsService,
    getCodSummaryService,
    createShipmentService,
    updateShipmentStatusService,
    reconcileCodService,
    deleteShipmentService,
    getOrderInfoForShipmentService
} from '../../services/admin/logisticsCodService.js';

export const getShipments = async (req, res) => {
    try {
        const { carrier, deliveryStatus, codStatus, search } = req.query;
        const shipments = await getShipmentsService({ carrier, deliveryStatus, codStatus, search });
        res.status(200).json({ success: true, data: shipments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCodSummary = async (req, res) => {
    try {
        const summary = await getCodSummaryService();
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createShipment = async (req, res) => {
    try {
        const shipment = await createShipmentService(req.body);
        res.status(201).json({ success: true, message: 'Tạo vận đơn thành công', data: shipment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateShipmentStatus = async (req, res) => {
    try {
        const { trang_thai_giao } = req.body;
        const shipment = await updateShipmentStatusService(req.params.id, trang_thai_giao);
        res.status(200).json({ success: true, message: 'Cập nhật trạng thái giao hàng thành công', data: shipment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const reconcileCod = async (req, res) => {
    try {
        const result = await reconcileCodService(req.params.id);
        res.status(200).json({ success: true, message: 'Đối soát tiền COD thành công', data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteShipment = async (req, res) => {
    try {
        await deleteShipmentService(req.params.id);
        res.status(200).json({ success: true, message: 'Xóa vận đơn thành công' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getOrderInfoForShipment = async (req, res) => {
    try {
        const order = await getOrderInfoForShipmentService(req.params.orderId);
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};
