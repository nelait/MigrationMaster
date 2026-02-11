const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database...');

    // Create demo user
    const passwordHash = await bcrypt.hash('password', 10);

    const user = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash
        }
    });

    console.log(`✅ Created demo user: admin / password (id: ${user.id})`);
    console.log('🎉 Seeding complete!');

    await prisma.$disconnect();
}

seed().catch((e) => {
    console.error('Seed error:', e);
    prisma.$disconnect();
    process.exit(1);
});
