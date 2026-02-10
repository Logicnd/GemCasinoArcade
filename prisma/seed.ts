import { PrismaClient, Role, Rarity, ItemType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Site config singleton
  await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      maintenanceMode: false,
      maintenanceMessage: '',
      dailyBonusBase: 250,
      streakBonus: 25,
      streakCap: 250,
      disclaimer:
        'Entertainment only. Virtual gems only. No real money. No prizes. No cash-out.',
      version: 1,
    },
  });

  // Game configs
  const gameConfigs = [
    {
      key: 'slots',
      config: {
        minBet: 10,
        maxBet: 200,
        payoutTable: {
          gem: 100,
          seven: 50,
          crown: 25,
          star: 15,
          heart: 10,
          coin: 5,
          cherry: 3,
        },
        partials: {
          gem: 5,
          seven: 3,
          crown: 2,
        },
      },
    },
    {
      key: 'mines',
      config: {
        gridSize: 25,
        minBet: 10,
        maxBet: 200,
        minMines: 3,
        maxMines: 15,
      },
    },
    {
      key: 'plinko',
      config: {
        rows: [8, 12, 16],
        risks: ['low', 'medium', 'high'],
        multipliers: {
          low: [0.5, 0.8, 1, 1.2, 2],
          medium: [0.3, 0.7, 1, 1.5, 3, 5],
          high: [0.2, 0.5, 1, 2, 5, 10],
        },
        minBet: 10,
        maxBet: 200,
      },
    },
    {
      key: 'blackjack',
      config: {
        minBet: 10,
        maxBet: 200,
        blackjackPayout: 1.5,
        dealerStandOn: 17,
      },
    },
    {
      key: 'jackpot',
      config: {
        minEntry: 50,
        roundDurationSeconds: 300,
        houseCutBps: 250, // 2.5%
      },
    },
  ];

  for (const g of gameConfigs) {
    await prisma.gameConfig.upsert({
      where: { key: g.key },
      update: { config: g.config, enabled: true },
      create: {
        key: g.key,
        config: g.config,
        enabled: true,
        version: 1,
      },
    });
  }

  // Items + cases
  const items = await Promise.all(
    [
      { name: 'Rookie', rarity: Rarity.COMMON, type: ItemType.TITLE, assetKey: 'title_rookie' },
      { name: 'High Roller', rarity: Rarity.RARE, type: ItemType.TITLE, assetKey: 'title_highroller' },
      { name: 'Gem Lord', rarity: Rarity.LEGENDARY, type: ItemType.TITLE, assetKey: 'title_gemlord' },
      { name: 'Arcade Master', rarity: Rarity.MYTHICAL, type: ItemType.TITLE, assetKey: 'title_arcademaster' },
      { name: 'Neon Frame', rarity: Rarity.UNCOMMON, type: ItemType.FRAME, assetKey: 'frame_neon' },
      { name: 'Royal Frame', rarity: Rarity.EPIC, type: ItemType.FRAME, assetKey: 'frame_royal' },
    ].map((item) =>
      prisma.item.upsert({
        where: { assetKey: item.assetKey },
        update: {},
        create: item,
      })
    )
  );

  const itemsByRarity = items.reduce<Record<string, string[]>>((acc, item) => {
    acc[item.rarity] = acc[item.rarity] || [];
    acc[item.rarity].push(item.id);
    return acc;
  }, {});

  await prisma.caseDefinition.upsert({
    where: { key: 'starter' },
    update: {
      rarityWeights: {
        COMMON: 600,
        UNCOMMON: 250,
        RARE: 90,
        EPIC: 40,
        LEGENDARY: 15,
        MYTHICAL: 4,
        DIVINE: 1,
        SECRET: 0.2,
      },
      itemPools: itemsByRarity,
    },
    create: {
      key: 'starter',
      name: 'Starter Crate',
      priceGems: 100,
      enabled: true,
      rarityWeights: {
        COMMON: 600,
        UNCOMMON: 250,
        RARE: 90,
        EPIC: 40,
        LEGENDARY: 15,
        MYTHICAL: 4,
        DIVINE: 1,
        SECRET: 0.2,
      },
      itemPools: itemsByRarity,
      version: 1,
    },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
