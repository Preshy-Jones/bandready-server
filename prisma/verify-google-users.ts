/**
 * One-off migration — marks all existing Google-linked users as email verified.
 * Safe to run multiple times (idempotent).
 *
 * Run with: pnpm db:verify-google-users
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      googleId: { not: null },
      isEmailVerified: false,
    },
    data: {
      isEmailVerified: true,
    },
  });

  console.log(`✅ Verified ${result.count} Google-linked user(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
