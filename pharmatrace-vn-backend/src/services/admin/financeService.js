import { 
    getFinanceStatsModel, 
    getCashbookModel, 
    createCashbookModel, 
    getArModel, 
    payArDebtModel, 
    getApModel, 
    payApDebtModel 
} from '../../models/admin/financeModel.js';

export const getFinanceStatsService = async (userContext = null) => {
    return await getFinanceStatsModel(userContext);
};

export const getCashbookService = async (filters, userContext = null) => {
    return await getCashbookModel(filters, userContext);
};

export const createCashbookService = async (data, userContext = null) => {
    if (!data.loai_phieu || !['Thu', 'Chi'].includes(data.loai_phieu)) {
        throw new Error('Loại phiếu phải là Thu hoặc Chi');
    }
    if (!data.so_tien || parseFloat(data.so_tien) <= 0) {
        throw new Error('Số tiền phải lớn hơn 0');
    }
    return await createCashbookModel(data, userContext);
};

export const getArService = async (filters, userContext = null) => {
    return await getArModel(filters, userContext);
};

export const payArDebtService = async (id, amount, note, userContext = null) => {
    if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Số tiền thu nợ phải lớn hơn 0');
    }
    return await payArDebtModel(id, parseFloat(amount), note, userContext);
};

export const getApService = async (filters, userContext = null) => {
    return await getApModel(filters, userContext);
};

export const payApDebtService = async (id, amount, note, userContext = null) => {
    if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Số tiền chi trả phải lớn hơn 0');
    }
    return await payApDebtModel(id, parseFloat(amount), note, userContext);
};
