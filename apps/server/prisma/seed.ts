import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding universities...');

  const universities = [
    // ═══ PUBLIC UNIVERSITIES ═══
    {
      name: 'University of Dhaka',
      shortName: 'DU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9d/University_of_Dhaka_logo.svg',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Bangladesh University of Engineering and Technology',
      shortName: 'BUET',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a0/BUET_LOGO.svg',
      type: 'PUBLIC' as const,
    },
    {
      name: 'University of Chittagong',
      shortName: 'CU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/68/University_of_Chittagong_logo.svg',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Rajshahi University',
      shortName: 'RU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b7/Rajshahi_University_Logo.svg',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Jahangirnagar University',
      shortName: 'JU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2e/Jahangirnagar_University_logo.svg',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Bangladesh Agricultural University',
      shortName: 'BAU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8b/Bangladesh_Agricultural_University_Logo.png',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Khulna University',
      shortName: 'KU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Khulna_University_logo.svg',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Shahjalal University of Science and Technology',
      shortName: 'SUST',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/09/Shahjalal_University_of_Science_%26_Technology_logo.svg',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Islamic University, Bangladesh',
      shortName: 'IU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/1c/Islamic_University%2C_Bangladesh_logo.svg',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Chittagong University of Engineering and Technology',
      shortName: 'CUET',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b4/CUET_logo.svg',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Rajshahi University of Engineering and Technology',
      shortName: 'RUET',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/62/RUET_logo.svg',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Khulna University of Engineering and Technology',
      shortName: 'KUET',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5e/Khulna_University_of_Engineering_%26_Technology_logo.svg',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Dhaka University of Engineering and Technology',
      shortName: 'DUET',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6e/DUET_logo.png',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Mawlana Bhashani Science and Technology University',
      shortName: 'MBSTU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4f/MBSTU_Logo.png',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Noakhali Science and Technology University',
      shortName: 'NSTU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d7/NSTU_Logo.png',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Jessore University of Science and Technology',
      shortName: 'JUST',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8e/JUST_logo.png',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Pabna University of Science and Technology',
      shortName: 'PUST',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5d/PUST_logo.png',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Comilla University',
      shortName: 'CoU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/3/thirty/Comilla_University_logo.png',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Begum Rokeya University',
      shortName: 'BRUR',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Begum_Rokeya_University_logo.png',
      type: 'PUBLIC' as const,
    },
    {
      name: 'Bangabandhu Sheikh Mujibur Rahman Science and Technology University',
      shortName: 'BSMRSTU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2d/BSMRSTU_logo.png',
      type: 'PUBLIC' as const,
    },

    // ═══ PRIVATE UNIVERSITIES ═══
    {
      name: 'BRAC University',
      shortName: 'BRACU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e6/BRAC_University_Logo.svg',
      type: 'PRIVATE' as const,
    },
    {
      name: 'North South University',
      shortName: 'NSU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c4/North_South_University_Logo.svg',
      type: 'PRIVATE' as const,
    },
    {
      name: 'Independent University, Bangladesh',
      shortName: 'IUB',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Independent_University_Bangladesh_logo.svg',
      type: 'PRIVATE' as const,
    },
    {
      name: 'East West University',
      shortName: 'EWU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f3/East_West_University_logo.svg',
      type: 'PRIVATE' as const,
    },
    {
      name: 'American International University-Bangladesh',
      shortName: 'AIUB',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e4/AIUB_Logo.svg',
      type: 'PRIVATE' as const,
    },
    {
      name: 'United International University',
      shortName: 'UIU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5f/United_International_University_logo.svg',
      type: 'PRIVATE' as const,
    },
    {
      name: 'Daffodil International University',
      shortName: 'DIU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c9/Daffodil_International_University_Logo.svg',
      type: 'PRIVATE' as const,
    },
    {
      name: 'Southeast University',
      shortName: 'SEU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4e/Southeast_University_Bangladesh_logo.png',
      type: 'PRIVATE' as const,
    },
    {
      name: 'Stamford University Bangladesh',
      shortName: 'SUB',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6b/Stamford_University_Bangladesh_logo.png',
      type: 'PRIVATE' as const,
    },
    {
      name: 'Bangladesh University of Business and Technology',
      shortName: 'BUBT',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3e/BUBT_logo.png',
      type: 'PRIVATE' as const,
    },
    {
      name: 'Metropolitan University',
      shortName: 'MU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9e/Metropolitan_University_Bangladesh_logo.png',
      type: 'PRIVATE' as const,
    },
    {
      name: 'Prime University',
      shortName: 'PU',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b3/Prime_University_logo.png',
      type: 'PRIVATE' as const,
    },
    {
      name: 'Green University of Bangladesh',
      shortName: 'GUB',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/1e/Green_University_of_Bangladesh_logo.png',
      type: 'PRIVATE' as const,
    },
    {
      name: 'Ahsanullah University of Science and Technology',
      shortName: 'AUST',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a3/Ahsanullah_University_of_Science_and_Technology_logo.svg',
      type: 'PRIVATE' as const,
    },
    {
      name: 'International Islamic University Chittagong',
      shortName: 'IIUC',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/69/IIUC_logo.svg',
      type: 'PRIVATE' as const,
    },
  ];

  for (const uni of universities) {
    const existing = await prisma.university.findFirst({
      where: { shortName: uni.shortName },
    });

    if (existing) {
      await prisma.university.update({
        where: { id: existing.id },
        data: { logoUrl: uni.logoUrl, name: uni.name },
      });
    } else {
      await prisma.university.create({ data: uni });
    }
    console.log(`✅ ${uni.shortName} - ${uni.name}`);
  }

  // ═══ CREATE ADMIN USER ═══
  const bcrypt = await import('bcryptjs');
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@covercraft.bd' } });

  if (!adminExists) {
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@covercraft.bd',
        passwordHash: await bcrypt.hash('Admin@2024', 12),
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created → email: admin@covercraft.bd | password: Admin@2024');
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
