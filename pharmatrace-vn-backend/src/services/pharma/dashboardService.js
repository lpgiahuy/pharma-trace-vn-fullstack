import * as dashboardModel from '../../models/pharma/dashboardModel.js';

// Helper function to calculate percentage change
const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
};

const getTrend = (current, previous) => current >= previous ? 'up' : 'down';

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
    const rawData = await dashboardModel.getOverallStats();
    
    return {
        revenue: {
            value: parseInt(rawData.rev_current || 0),
            change: calculateChange(parseInt(rawData.rev_current || 0), parseInt(rawData.rev_prev || 0)),
            trend: getTrend(parseInt(rawData.rev_current || 0), parseInt(rawData.rev_prev || 0))
        },
        orders: {
            value: parseInt(rawData.orders_current || 0),
            change: calculateChange(parseInt(rawData.orders_current || 0), parseInt(rawData.orders_prev || 0)),
            trend: getTrend(parseInt(rawData.orders_current || 0), parseInt(rawData.orders_prev || 0))
        },
        customers: {
            value: parseInt(rawData.cust_current || 0),
            change: calculateChange(parseInt(rawData.cust_current || 0), parseInt(rawData.cust_prev || 0)),
            trend: getTrend(parseInt(rawData.cust_current || 0), parseInt(rawData.cust_prev || 0))
        },
        lowStock: {
            value: parseInt(rawData.low_stock_count || 0),
            change: '', // Low stock doesn't really need a month-over-month trend in this UI
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