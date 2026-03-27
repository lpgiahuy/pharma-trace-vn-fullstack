import * as dashboardService from '../../services/pharma/dashboardService.js';

const getDashboardData = async (req, res, next) => {
    try {
        const data = await dashboardService.fetchAdminDashboard();
        
        res.status(200).json({
            success: true,
            message: 'Admin dashboard loaded successfully!',
            data: data
        });
    } catch (error) {
        next(error);
    }
};


export { getDashboardData };