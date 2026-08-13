import { 
    getFinanceStatsModel, 
    getCashbookModel, 
    createCashbookModel, 
    getArModel, 
    payArDebtModel, 
    getApModel, 
    payApDebtModel 
} from '../../models/admin/financeModel.js';

export const getFinanceStatsService = async () => {
    return await getFinanceStatsModel();
};

export const getCashbookService = async (filters) => {
    return await getCashbookModel(filters);
};

export const createCashbookService = async (data) => {
    if (!data.loai_phieu || !['Thu', 'Chi'].includes(data.loai_phieu)) {
        throw new Error('Loại phiếu phải là Thu hoặc Chi');
    }
    if (!data.so_tien || parseFloat(data.so_tien) <= 0) {
        throw new Error('Số tiền phải lớn hơn 0');
    }
    return await createCashbookModel(data);
};

export const getArService = async (filters) => {
    return await getArModel(filters);
};

export const payArDebtService = async (id, amount, note) => {
    if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Số tiền thu nợ phải lớn hơn 0');
    }
    return await payArDebtModel(id, parseFloat(amount), note);
};

export const getApService = async (filters) => {
    return await getApModel(filters);
};

export const payApDebtService = async (id, amount, note) => {
    if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Số tiền chi trả phải lớn hơn 0');
    }
    return await payApDebtModel(id, parseFloat(amount), note);
};
