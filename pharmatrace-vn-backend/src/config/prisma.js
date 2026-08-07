import pkgPrisma from '@prisma/client';
const { PrismaClient } = pkgPrisma;
import { PrismaPg } from '@prisma/adapter-pg';
import pool from './db.js';

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
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
