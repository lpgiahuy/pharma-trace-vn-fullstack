import {
    getCustomersCrmService,
    getCrmStatsService,
    getCustomerPointsHistoryService,
    adjustCustomerPointsService,
    getRmaRequestsService,
    updateRmaStatusService,
    getRmaDetailService
} from '../../services/admin/crmLoyaltyRmaService.js';

export const getCustomersCrm = async (req, res) => {
    try {
        const { rank, search } = req.query;
        const customers = await getCustomersCrmService({ rank, search });
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCrmStats = async (req, res) => {
    try {
        const stats = await getCrmStatsService();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCustomerPointsHistory = async (req, res) => {
    try {
        const history = await getCustomerPointsHistoryService(req.params.customerId);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adjustCustomerPoints = async (req, res) => {
    try {
        const result = await adjustCustomerPointsService(req.body);
        res.status(200).json({ success: true, message: 'Điều chỉnh điểm thưởng thành công', data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getRmaRequests = async (req, res) => {
    try {
        const { status, search } = req.query;
        const rmas = await getRmaRequestsService({ status, search });
        res.status(200).json({ success: true, data: rmas });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateRmaStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const rma = await updateRmaStatusService(req.params.id, status);
        res.status(200).json({ success: true, message: 'Cập nhật trạng thái phiếu RMA thành công', data: rma });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getRmaDetail = async (req, res) => {
    try {
        const detail = await getRmaDetailService(req.params.id);
        res.status(200).json({ success: true, data: detail });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};
