import * as dashboardModel from '../../models/pharma/dashboardModel.js';

// Helper function to calculate percentage change
const calculateChange = (current, previous) => {
    const cur = Number(current) || 0;
    const prev = Number(previous) || 0;
    if (prev === 0) return cur > 0 ? 100 : 0;
    const change = ((cur - prev) / prev) * 100;
    if (isNaN(change)) return 0;
    return parseFloat(change.toFixed(1));
};

const getTrend = (current, previous) => {
    const cur = Number(current) || 0;
    const prev = Number(previous) || 0;
    return cur >= prev ? 'up' : 'down';
};

export const fetchAdminDashboard = async () => {
    // Legacy endpoint: Keep it for compatibility if needed
    const [heatmap, canDate, doanhThu, tonKho] = await Promise.all([
        dashboardModel.getHeatmapData(),
        dashboardModel.getNearExpiredDrugs(),
        dashboardModel.getDailyRevenue(),
        dashboardModel.getInventorySummary()
    ]);
    return {
        heatmap_diem_nong: heatmap, 
        thuoc_can_date: canDate,     
        bieu_do_doanh_thu: doanhThu, 
        tong_quan_kho: tonKho        
    };
};

export const fetchDashboardStats = async () => {
    const rawData = (await dashboardModel.getOverallStats()) || {};
    
    const revCurrent = Number(rawData.rev_current) || 0;
    const revPrev = Number(rawData.rev_prev) || 0;
    const ordersCurrent = Number(rawData.orders_current) || 0;
    const ordersPrev = Number(rawData.orders_prev) || 0;
    const custCurrent = Number(rawData.cust_current) || 0;
    const custPrev = Number(rawData.cust_prev) || 0;
    const lowStockCount = Number(rawData.low_stock_count) || 0;

    return {
        revenue: {
            value: revCurrent,
            change: calculateChange(revCurrent, revPrev),
            trend: getTrend(revCurrent, revPrev)
        },
        orders: {
            value: ordersCurrent,
            change: calculateChange(ordersCurrent, ordersPrev),
            trend: getTrend(ordersCurrent, ordersPrev)
        },
        customers: {
            value: custCurrent,
            change: calculateChange(custCurrent, custPrev),
            trend: getTrend(custCurrent, custPrev)
        },
        lowStock: {
            value: lowStockCount,
            change: '0%', // Low stock doesn't really need a month-over-month trend in this UI
            trend: 'down' // Just default
        }
    };
};

export const fetchRevenueChart = async () => {
    const chartData = await dashboardModel.getMonthlyRevenueChart();
    // Parse int for react recharts
    return chartData.map(item => ({
        month: item.month,
        revenue: parseInt(item.revenue),
        orders: parseInt(item.orders)
    }));
};

export const fetchTopProducts = async (limit = 5) => {
    return await dashboardModel.getTopSellingProducts(limit);
};

export const fetchLowStockAlerts = async () => {
    return await dashboardModel.getLowStockItems();
};

export const fetchCategoryRevenue = async () => {
    const rows = await dashboardModel.getCategoryRevenue();
    return rows.map(r => ({
        category: r.category,
        revenue: parseInt(r.revenue),
    }));
};

export const fetchCategoryProductCount = async () => {
    const rows = await dashboardModel.getCategoryProductCount();
    return rows.map(r => ({
        category: r.category,
        count: r.count,
    }));
};