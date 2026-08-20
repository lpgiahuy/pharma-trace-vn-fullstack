import prisma, { serializeBigInt } from '../../config/prisma.js';

const createRmaRequest = async (khach_hang_id, don_hang_id, ly_do_tra) => {
    const result = await prisma.phieutrahang.create({
        data: {
            khach_hang_id: Number(khach_hang_id),
            don_hang_id: Number(don_hang_id),
            ly_do_tra
        }
    });
    return serializeBigInt(result);
};

export { createRmaRequest };