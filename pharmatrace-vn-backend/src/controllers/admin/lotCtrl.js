import {
    getLotsService,
    getLotStatsService,
    createLotService,
    recallLotService
} from '../../services/admin/lotService.js';

export const getLots = async (req, res) => {
    try {
        const { status, search } = req.query;
        const lots = await getLotsService({ status, search });
        res.status(200).json({ success: true, data: lots });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getLotStats = async (req, res) => {
    try {
        const stats = await getLotStatsService();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createLot = async (req, res) => {
    try {
        const lot = await createLotService(req.body);
        res.status(201).json({ success: true, message: 'Tạo lô sản phẩm thành công', data: lot });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const recallLot = async (req, res) => {
    try {
        const lot = await recallLotService(req.params.id);
        res.status(200).json({ success: true, message: 'Kích hoạt Thu hồi sản phẩm thành công', data: lot });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
