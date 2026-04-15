import * as dashboardService from '../../services/pharma/dashboardService.js';

export const getDashboardData = async (req, res, next) => {
    try {
        const data = await dashboardService.fetchAdminDashboard();
        res.status(200).json({ success: true, message: 'Admin dashboard loaded successfully!', data: data });
    } catch (error) {
        next(error);
    }
};

export const getDashboardStats = async (req, res, next) => {
    try {
        const data = await dashboardService.fetchDashboardStats();
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

export const getRevenueChart = async (req, res, next) => {
    try {
        const data = await dashboardService.fetchRevenueChart();
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

export const getTopProducts = async (req, res, next) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        const data = await dashboardService.fetchTopProducts(limit);
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

export const getLowStockAlerts = async (req, res, next) => {
    try {
        const data = await dashboardService.fetchLowStockAlerts();
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};