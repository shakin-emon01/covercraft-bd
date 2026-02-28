import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const normalizeUniversityName = (value: string) => {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const hasCounterSuffix = (shortName: string) => /-\d+$/.test(shortName);

const buildUniqueShortName = (baseShortName: string, usedShortNames: Set<string>) => {
  if (!usedShortNames.has(baseShortName)) return baseShortName;

  let counter = 1;
  let candidate = `${baseShortName}-${counter}`;
  while (usedShortNames.has(candidate)) {
    counter++;
    candidate = `${baseShortName}-${counter}`;
  }
  return candidate;
};

// Your provided dataset
const universityData = {
    "public": [
        "University of Dhaka (DU)", "University of Rajshahi (RU)", "University of Chittagong (CU)",
        "Jahangirnagar University (JU)", "Islamic University Bangladesh (IU)", "Khulna University (KU)",
        "Jagannath University (JnU)", "Comilla University (CoU)", "Jatiya Kabi Kazi Nazrul Islam University (JKKNIU)",
        "Bangladesh University of Professionals (BUP)", "Begum Rokeya University Rangpur (BRUR)",
        "University of Barishal (BU)", "Rabindra University Bangladesh (RUB)", "Netrokona University (NkU)",
        "Kishoreganj University (KgU)", "Meherpur University (MU)", "Thakurgaon University (TU)",
        "Naogaon University (NgU)", "Shahjalal University of Science and Technology (SUST)",
        "Hajee Mohammad Danesh Science & Technology University (HSTU)", "Mawlana Bhashani Science and Technology University (MBSTU)",
        "Patuakhali Science and Technology University (PSTU)", "Noakhali Science and Technology University (NSTU)",
        "Jashore University of Science and Technology (JUST)", "Pabna University of Science and Technology (PUST)",
        "Gopalganj Science and Technology University (GSTU)", "Rangamati Science and Technology University (RmSTU)",
        "Jamalpur Science and Technology University (JSTU)", "Chandpur Science and Technology University (CSTU)",
        "Sunamganj Science and Technology University (SSTU)", "Bogra Science and Technology University (BSTU)",
        "Lakshmipur Science and Technology University (LSTU)", "Pirojpur Science & Technology University (PrSTU)",
        "Satkhira University of Science and Technology (SaUST)", "Narayanganj Science and Technology University (NGSTU)",
        "Bangladesh University of Engineering & Technology (BUET)", "Military Institute of Science and Technology (MIST)",
        "Rajshahi University of Engineering & Technology (RUET)", "Khulna University of Engineering & Technology (KUET)",
        "Chittagong University of Engineering & Technology (CUET)", "Dhaka University of Engineering & Technology (DUET)",
        "Bangladesh Agricultural University (BAU)", "Gazipur Agricultural University (GAU)",
        "Sher-e-Bangla Agricultural University (SBAU)", "Sylhet Agricultural University (SAU)",
        "Khulna Agricultural University (KAU)", "Habiganj Agricultural University (HAU)",
        "Kurigram Agricultural University (KuriAU)", "Shariatpur Agriculture University (ShAU)",
        "Bangladesh Medical University (BMU)", "Chittagong Medical University (CMU)",
        "Rajshahi Medical University (RMU)", "Sylhet Medical University (SMU)",
        "Khulna Medical University (KMU)", "Chittagong Veterinary and Animal Sciences University (CVASU)",
        "Bangladesh University of Textiles (BUTEX)", "Bangladesh Maritime University (BMU)",
        "University of Frontier Technology Bangladesh (UFTB)", "Aviation and Aerospace University Bangladesh (AAUB)",
        "National University Bangladesh (NU)", "Bangladesh Open University (BOU)",
        "Islamic Arabic University (IAU)", "Dhaka Central University (DCU)"
    ],
    "private": [
        "International University of Business Agriculture and Technology (IUBAT)", "North South University (NSU)",
        "Independent University, Bangladesh (IUB)", "American International University-Bangladesh (AIUB)",
        "Dhaka International University (DIU)", "International Islamic University, Chittagong (IIUC)",
        "Asian University of Bangladesh (AUB)", "East West University (EWU)", "Gono Bishwabidyalay (GB)",
        "People's University of Bangladesh (PUB)", "Queens University (QU)", "University of Asia Pacific (UAP)",
        "Chittagong Independent University (CIU)", "Bangladesh University (BU)", "BGC Trust University Bangladesh (BGCTUB)",
        "Brac University (BracU)", "Manarat International University (MIU)", "Premier University (PU)",
        "Southern University Bangladesh (SUB)", "Sylhet International University (SIU)",
        "University of Development Alternative (UODA)", "City University Bangladesh (CUB)",
        "Daffodil International University (DIU)", "Green University of Bangladesh (GUB)",
        "IBAIS University (IU)", "Leading University (LU)", "Northern University Bangladesh (NUB)",
        "Prime University (PU)", "Southeast University (SEU)", "Stamford University Bangladesh (SU)",
        "State University of Bangladesh (SUB)", "Eastern University Bangladesh (EU)",
        "Metropolitan University (MU)", "Millennium University (MU)", "Primeasia University (PAU)",
        "Royal University of Dhaka (RUD)", "United International University (UIU)",
        "University of Information Technology and Sciences (UITS)", "University of South Asia (USAB)",
        "Presidency University (PU)", "Uttara University (UU)", "Victoria University of Bangladesh (VUB)",
        "World University of Bangladesh (WUB)", "Asa University Bangladesh (ASAUB)",
        "Bangladesh Islami University (BIU)", "East Delta University (EDU)",
        "Northern University of Business and Technology Khulna (NUB)", "Britannia University (BU)",
        "Feni University (FU)", "Khwaja Yunus Ali University (KYAU)", "European University of Bangladesh (EUB)",
        "First Capital University Of Bangladesh (FCUB)", "BGMEA University of Fashion & Technology (BUFT)",
        "Hamdard University Bangladesh (HUB)", "Ishakha International University (IIUB)",
        "North East University Bangladesh (NEUB)", "North Western University Bangladesh (NWU)",
        "Port City International University (PCIU)", "Varendra University (VU)", "Sonargaon University (SU)",
        "Cox's Bazar International University (CBIU)", "Fareast International University (FIU)",
        "German University Bangladesh (GUB)", "North Bengal International University (NBIU)",
        "Notre Dame University Bangladesh (NDUB)", "Ranada Prasad Shaha University (RPSU)",
        "Brahmaputra International University (BIU)", "Times University Bangladesh (TMUB)",
        "Canadian University of Bangladesh (CUB)", "Global University Bangladesh (GUB)",
        "NPI University of Bangladesh (NPIUB)", "Rabindra Maitree University (RMU)",
        "University of Scholars (IUS)", "University of Creative Technology Chittagong (UCTC)",
        "Anwer Khan Modern University (AKMU)", "University of Global Village (UIGV)",
        "Khulna Khan Bahadur Ahsanullah University (KKBAU)", "Trust University Barishal (TUB)",
        "University of Brahmanbaria (UOB)", "University of Skill Enrichment and Technology (USET)",
        "International Standard University (ISU)", "ZNRF University of Management Sciences (ZUMS)",
        "Bandarban University (BdU)", "RTM Al-Kabir Technical University (RTM-AKTU)",
        "University of Science & Technology Chittagong (USTC)", "Ahsanullah University of Science and Technology (AUST)",
        "Pundra University of Science and Technology (PDUST)", "Bangladesh University of Business and Technology (BUBT)",
        "Atish Dipankar University of Science and Technology (ADUST)", "ZH Sikder University of Science & Technology (ZHSUST)",
        "Rajshahi Science & Technology University (RSTU)", "Bangladesh Army International University of Science & Technology (BAIUST)",
        "Bangladesh Army University of Science & Technology Khulna (BAUST Khulna)", "Bangladesh Army University of Science and Technology Saidpur (BAUST Saidpur)",
        "CCN University of Science & Technology (CCNUST)", "Central University of Science and Technology (CUST)",
        "Dr. Momtaz Begum University of Science and Technology (MUST)", "Central Women's University (CWU)",
        "Shanto-Mariam University of Creative Technology (SMUCT)", "University of Liberal Arts Bangladesh (ULAB)",
        "Bangladesh University of Health Sciences (BUHS)", "Exim Bank Agricultural University Bangladesh (EBAUB)",
        "Bangladesh Army University of Engineering & Technology (BAUET)", "Tagore University of Creative Arts (TUCA)"
    ]
};

async function main() {
  console.log('🌱 Analyzing and Syncing Universities of Bangladesh...');

  // Helper function to separate Name and ShortName gracefully
  const processList = (list: string[], type: 'PUBLIC' | 'PRIVATE') => {
    return list.map(item => {
      const match = item.match(/(.+)\s\((.+)\)$/);
      if (match) {
        return { name: match[1].trim(), shortName: match[2].trim(), type };
      }
      return { name: item.trim(), shortName: item.trim().substring(0, 5).toUpperCase(), type };
    });
  };

  const dedupedFromSource = new Map<string, { name: string; shortName: string; type: 'PUBLIC' | 'PRIVATE' }>();
  const allUnisRaw = [
    ...processList(universityData.public, 'PUBLIC'),
    ...processList(universityData.private, 'PRIVATE')
  ];

  for (const uni of allUnisRaw) {
    const normalized = normalizeUniversityName(uni.name);
    if (!dedupedFromSource.has(normalized)) {
      dedupedFromSource.set(normalized, uni);
    }
  }

  const allUnis = Array.from(dedupedFromSource.values());

  // Step 0: Cleanup already duplicated universities in DB (same normalized name).
  const existingRows = await prisma.university.findMany({
    select: {
      id: true,
      name: true,
      shortName: true,
      logoUrl: true,
      createdAt: true
    }
  });

  const groupedByNormalizedName = new Map<string, typeof existingRows>();
  for (const row of existingRows) {
    const normalized = normalizeUniversityName(row.name);
    const current = groupedByNormalizedName.get(normalized) ?? [];
    current.push(row);
    groupedByNormalizedName.set(normalized, current);
  }

  let removedDuplicates = 0;
  let relinkedProfiles = 0;

  for (const group of groupedByNormalizedName.values()) {
    if (group.length < 2) continue;

    const sorted = [...group].sort((a, b) => {
      const aIsCounter = hasCounterSuffix(a.shortName) ? 1 : 0;
      const bIsCounter = hasCounterSuffix(b.shortName) ? 1 : 0;
      if (aIsCounter !== bIsCounter) return aIsCounter - bIsCounter;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    await prisma.$transaction(async (tx) => {
      const [primary, ...duplicates] = sorted;
      let primaryId = primary.id;
      let primaryLogo = primary.logoUrl?.trim() ?? '';

      if (!primaryLogo) {
        const donor = duplicates.find((item) => (item.logoUrl?.trim() ?? '').length > 0);
        if (donor) {
          await tx.university.update({
            where: { id: primary.id },
            data: { logoUrl: donor.logoUrl }
          });
          primaryLogo = donor.logoUrl;
        }
      }

      for (const duplicate of duplicates) {
        const updatedProfiles = await tx.profile.updateMany({
          where: { universityId: duplicate.id },
          data: { universityId: primaryId }
        });
        relinkedProfiles += updatedProfiles.count;

        await tx.university.delete({
          where: { id: duplicate.id }
        });
        removedDuplicates++;
      }
    });
  }

  if (removedDuplicates > 0) {
    console.log(`🧹 Removed ${removedDuplicates} duplicate universities and relinked ${relinkedProfiles} profile records.`);
  }

  const currentUniversities = await prisma.university.findMany({
    select: {
      name: true,
      shortName: true
    }
  });

  const existingNormalizedNames = new Set(
    currentUniversities.map((uni) => normalizeUniversityName(uni.name))
  );
  const usedShortNames = new Set(currentUniversities.map((uni) => uni.shortName));

  let created = 0;
  let skipped = 0;

  for (const uni of allUnis) {
    const normalizedName = normalizeUniversityName(uni.name);

    // 1. Skip if equivalent university name already exists in DB.
    if (existingNormalizedNames.has(normalizedName)) {
      skipped++;
      continue;
    }

    // 2. Build a unique shortName only when needed.
    const finalShortName = buildUniqueShortName(uni.shortName, usedShortNames);

    // 3. Create new university safely.
    await prisma.university.create({
      data: {
        name: uni.name,
        shortName: finalShortName,
        type: uni.type,
        logoUrl: ''
      }
    });

    existingNormalizedNames.add(normalizedName);
    usedShortNames.add(finalShortName);
    created++;
  }

  console.log(`✅ Sync Complete!`);
  console.log(`📊 Successfully Added: ${created} new universities.`);
  console.log(`🛡️ Skipped & Protected: ${skipped} existing universities (logos kept safe!).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
