import { PrismaClient, type Prisma } from "@prisma/client";

import { getAllScenarios } from "../lib/scenarios";

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

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { email: TEST_USER.email },
    update: {},
    create: TEST_USER,
  });

  const scenarios = getAllScenarios();
  for (const s of scenarios) {
    const data: Prisma.ScenarioCreateInput = {
      id: s.id,
      title: s.title,
      tier: s.tier,
      clientId: s.client,
      skill: s.skill,
      difficulty: s.difficulty,
      contentPath: `content/scenarios/${s.id}.yaml`,
    };
    await prisma.scenario.upsert({
      where: { id: s.id },
      update: data,
      create: data,
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
