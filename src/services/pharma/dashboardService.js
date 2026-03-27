import * as dashboardModel from '../../models/pharma/dashboardModel.js';

export const fetchAdminDashboard = async () => {
    // use Promise.all to fetch all data in parallel for better performance
    const [heatmap, canDate, doanhThu, tonKho] = await Promise.all([
        dashboardModel.getHeatmapData(),
        dashboardModel.getNearExpiredDrugs(),
        dashboardModel.getDailyRevenue(),
        dashboardModel.getInventorySummary()
    ]);

    // format data as needed for frontend (e.g. convert date formats, calculate additional fields, etc.) - this is just a placeholder
    return {
        // data for heatmap of suspicious QR code scans (potential counterfeit hotspots)
        heatmap_diem_nong: heatmap, 
        
        // data for list of medicines nearing expiry (within 60 days)
        thuoc_can_date: canDate,     
        
        // data for daily revenue chart (line chart showing revenue trends over time)
        bieu_do_doanh_thu: doanhThu, 
        
        // data for overall inventory summary by warehouse (total products in stock, etc.)
        tong_quan_kho: tonKho        
    };
};