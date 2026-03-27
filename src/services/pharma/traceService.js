import * as traceModel from '../../models/pharma/traceModel.js';

const processQRScan = async (uid, lat, lng, ip) => {
    // Check if UID exists and get box info
    let boxInfo = await traceModel.getBoxInfo(uid);
    if (!boxInfo) {
        const error = new Error('Invalid QR code or not recognized by Pharma-Chain system');
        error.statusCode = 404;
        throw error;
    }

    // 2. insert log scan 
    // trigger geo-tracking in database will automatically update 'trang_thai' to 'CanhBaoGia' if it detects suspicious coordinates/time
    await traceModel.insertScanLog(uid, lat, lng, ip);

    // get updated box info after trigger update
    boxInfo = await traceModel.getBoxInfo(uid);

    // get distribution history to show the supply chain journey of the product (for transparency and consumer trust)
    const history = await traceModel.getDistributionHistory(uid);

    return {
        box_info: boxInfo,
        trace_history: history,
        is_authentic: boxInfo.trang_thai !== 'CanhBaoGia'
    };
};

export { processQRScan };