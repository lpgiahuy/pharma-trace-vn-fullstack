import {
    getSuppliersService,
    createSupplierService,
    getPurchaseOrdersService,
    getPurchaseOrderByIdService,
    createPurchaseOrderService,
    updatePurchaseOrderStatusService
} from '../../services/admin/procurementService.js';

export const getSuppliers = async (req, res) => {
    try {
        const suppliers = await getSuppliersService();
        res.status(200).json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createSupplier = async (req, res) => {
    try {
        const supplier = await createSupplierService(req.body);
        res.status(201).json({ success: true, message: 'Tạo nhà cung cấp thành công', data: supplier });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getPurchaseOrders = async (req, res) => {
    try {
        const orders = await getPurchaseOrdersService();
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPurchaseOrderById = async (req, res) => {
    try {
        const order = await getPurchaseOrderByIdService(req.params.id);
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const createPurchaseOrder = async (req, res) => {
    try {
        const nguoi_tao_id = req.user?.id || req.user?.nhan_vien_id || null;
        const order = await createPurchaseOrderService({
            ...req.body,
            nguoi_tao_id
        });
        res.status(201).json({ success: true, message: 'Tạo phiếu nhập hàng thành công', data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updatePurchaseOrderStatus = async (req, res) => {
    try {
        const { trang_thai } = req.body;
        const order = await updatePurchaseOrderStatusService(req.params.id, trang_thai);
        res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
