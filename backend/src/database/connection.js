const { PrismaClient } = require('@prisma/client');

// Bitta Prisma nusxasi butun ilova uchun
const prisma = new PrismaClient({ log: ['warn', 'error'] });

module.exports = prisma;
