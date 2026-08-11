import pkgPrisma from '@prisma/client';
const { PrismaClient } = pkgPrisma;
import { PrismaPg } from '@prisma/adapter-pg';
import pool from './db.js';
import { getCurrentUserContext } from '../utils/userContext.js';

const adapter = new PrismaPg(pool);
const basePrisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const user = getCurrentUserContext();
                if (!user) {
                    return query(args);
                }
                
                return basePrisma.$transaction(async (tx) => {
                    const userId = user.id ? String(user.id) : '';
                    const userType = user.type || (user.role === 'customer' ? 'customer' : 'staff');
                    const unitId = user.don_vi_id ? String(user.don_vi_id) : '';
                    const role = user.role || '';

                    await tx.$executeRawUnsafe(`
                        SET LOCAL app.current_user_id = '${userId}';
                        SET LOCAL app.current_user_type = '${userType}';
                        SET LOCAL app.current_unit_id = '${unitId}';
                        SET LOCAL app.current_user_role = '${role}';
                    `);

                    // Ensure the model query runs on the transaction client `tx`
                    const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
                    if (tx[modelKey] && typeof tx[modelKey][operation] === 'function') {
                        return tx[modelKey][operation](args);
                    }
                    return query(args);
                });
            }
        }
    }
});

export const serializeBigInt = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return Number(obj);
    
    // Convert Prisma Decimal to standard JavaScript Number
    if (typeof obj === 'object' && obj.constructor && (obj.constructor.name.includes('Decimal') || (obj.s !== undefined && obj.e !== undefined && Array.isArray(obj.d)))) {
        return Number(obj.toString());
    }
    
    if (Array.isArray(obj)) return obj.map(serializeBigInt);
    if (typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = serializeBigInt(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

export default prisma;

