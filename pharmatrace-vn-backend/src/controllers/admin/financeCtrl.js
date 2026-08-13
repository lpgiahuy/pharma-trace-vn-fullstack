import { 
    getFinanceStatsService, 
    getCashbookService, 
    createCashbookService, 
    getArService, 
    payArDebtService, 
    getApService, 
    payApDebtService 
} from '../../services/admin/financeService.js';

export const getFinanceStats = async (req, res) => {
    try {
        const stats = await getFinanceStatsService();
        res.status(200).json({ success: true, data: stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getCashbook = async (req, res) => {
    try {
        const list = await getCashbookService(req.query);
        res.status(200).json({ success: true, data: list });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createCashbook = async (req, res) => {
    try {
        const record = await createCashbookService({ ...req.body, created_by: req.user?.id });
        res.status(201).json({ success: true, message: 'Lập phiếu thu/chi thành công', data: record });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const getAr = async (req, res) => {
    try {
        const list = await getArService(req.query);
        res.status(200).json({ success: true, data: list });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const payArDebt = async (req, res) => {
    try {
        const { amount, note } = req.body;
        const result = await payArDebtService(req.params.id, amount, note);
        res.status(200).json({ success: true, message: 'Ghi nhận thu nợ thành công', data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const getAp = async (req, res) => {
    try {
        const list = await getApService(req.query);
        res.status(200).json({ success: true, data: list });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const payApDebt = async (req, res) => {
    try {
        const { amount, note } = req.body;
        const result = await payApDebtService(req.params.id, amount, note);
        res.status(200).json({ success: true, message: 'Ghi nhận trả nợ NCC thành công', data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
