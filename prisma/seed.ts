import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_USER: Prisma.UserCreateInput = {
  id: "user_roy_local",
  email: "roy@aegis.local",
  name: "Roy",
  level: 1,
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  skillProgress: {},
  badges: [],
};

const STUB_SCENARIOS: Prisma.ScenarioCreateInput[] = [
  {
    id: "scenario_001",
    title: "Parent SAR for pupil records",
    tier: 1,
    clientId: "bramble_lane_primary",
    skill: "sar_handling",
    difficulty: "straightforward",
    contentPath: "content/scenarios/scenario_001.yaml",
  },
  {
    id: "scenario_002",
    title: "FOI request on contract spend",
    tier: 2,
    clientId: "hartwell_council",
    skill: "foi_decisions",
    difficulty: "complex",
    contentPath: "content/scenarios/scenario_002.yaml",
  },
  {
    id: "scenario_003",
    title: "DPIA for M&A due diligence portal",
    tier: 3,
    clientId: "meridian_capital",
    skill: "dpia_authoring",
    difficulty: "contested",
    contentPath: "content/scenarios/scenario_003.yaml",
  },
];

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { email: TEST_USER.email },
    update: {},
    create: TEST_USER,
  });

  for (const scenario of STUB_SCENARIOS) {
    await prisma.scenario.upsert({
      where: { id: scenario.id },
      update: {},
      create: scenario,
    });
  }

  const userCount = await prisma.user.count();
  const scenarioCount = await prisma.scenario.count();
  console.log(
    `Seed complete. Users: ${userCount}, Scenarios: ${scenarioCount}.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
