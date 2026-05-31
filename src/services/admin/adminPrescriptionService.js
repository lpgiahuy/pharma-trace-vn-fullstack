import * as adminPrescriptionModel from '../../models/admin/adminPrescriptionModel.js';

export const fetchPrescriptions = async (status) => {
    return await adminPrescriptionModel.getPrescriptions(status);
};

export const changePrescriptionStatus = async (id, status) => {
    // Only these 3 statuses are accepted (enforced by a CHECK constraint in the database)
    const validStatuses = ['ChoDuyet', 'HopLe', 'TuChoi'];

    if (!validStatuses.includes(status)) {
        const error = new Error('Invalid status! Accepted values: ChoDuyet, HopLe, TuChoi.');
        error.statusCode = 400;
        throw error;
    }

    const updated = await adminPrescriptionModel.updatePrescriptionStatus(id, status);

    if (!updated) {
        const error = new Error('Prescription not found in the system!');
        error.statusCode = 404;
        throw error;
    }
    
    return updated;
};