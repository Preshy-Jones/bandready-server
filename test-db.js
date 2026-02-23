const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.essaySubmission.findMany({ take: 2, orderBy: { submittedAt: 'desc' } })
  .then(console.log)
  .finally(() => prisma.$disconnect());
