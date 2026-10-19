import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { checkPassword, hashPassword } from '../modules/identity/password.js';

/**
 * İlk süper yöneticiyi oluşturur. Değerler ortam değişkenlerinden okunur (sohbete/argümana sır yazılmaz):
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 * Zaten bir süper yönetici varsa reddeder. Yeni yönetici ilk girişte 2FA kurmak zorundadır.
 */
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || 'Yönetici';
const url = process.env.DATABASE_URL;
if (!email || !password || !url) {
  console.error('ADMIN_EMAIL, ADMIN_PASSWORD ve DATABASE_URL gerekli.');
  process.exit(1);
}
const problem = checkPassword(password, email);
if (problem) {
  console.error(`Parola politikası: ${problem}`);
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
try {
  const existing = await prisma.staffRoleAssignment.count({ where: { role: 'SUPER_ADMIN' } });
  if (existing > 0) {
    console.error('REDDEDİLDİ: Zaten bir süper yönetici var. Rolleri panelden yönetin.');
    process.exit(2);
  }
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      displayName: name,
      emailVerifiedAt: new Date(),
      ageConfirmedAt: new Date(),
      termsVersion: 'staff-bootstrap',
      roles: { create: { role: 'SUPER_ADMIN' } },
    },
  });
  await prisma.auditLog.create({
    data: { action: 'cli.create_super_admin', targetType: 'user', targetId: user.id },
  });
  console.warn(`Süper yönetici oluşturuldu: ${email} (ilk girişte 2FA kurulumu zorunlu)`);
} finally {
  await prisma.$disconnect();
}
