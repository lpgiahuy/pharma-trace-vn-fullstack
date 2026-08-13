import * as dashboardService from '../../services/pharma/dashboardService.js';

export const getDashboardData = async (req, res, next) => {
    try {
        const data = await dashboardService.fetchAdminDashboard(req.user);
        res.status(200).json({ success: true, message: 'Admin dashboard loaded successfully!', data: data });
    } catch (error) {
        next(error);
    }
};

export const getDashboardStats = async (req, res, next) => {
    try {
        const data = await dashboardService.fetchDashboardStats(req.user);
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

export const getRevenueChart = async (req, res, next) => {
    try {
        const data = await dashboardService.fetchRevenueChart(req.user);
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

export const getTopProducts = async (req, res, next) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        const data = await dashboardService.fetchTopProducts(limit, req.user);
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

export const getLowStockAlerts = async (req, res, next) => {
    try {
        const data = await dashboardService.fetchLowStockAlerts(req.user);
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

export const getCategoryRevenue = async (req, res, next) => {
    try {
        const data = await dashboardService.fetchCategoryRevenue(req.user);
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

export const getCategoryCount = async (req, res, next) => {
    try {
        const data = await dashboardService.fetchCategoryProductCount(req.user);
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};