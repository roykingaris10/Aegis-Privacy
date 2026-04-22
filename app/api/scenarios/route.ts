import { NextResponse } from "next/server";

import { getAllScenarios } from "@/lib/scenarios";
import { getAllClients } from "@/lib/clients";

export const dynamic = "force-static";

export async function GET(): Promise<NextResponse> {
  const scenarios = getAllScenarios();
  const clients = getAllClients();
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  const payload = scenarios.map((s) => {
    const client = clientMap.get(s.client);
    return {
      id: s.id,
      title: s.title,
      tier: s.tier,
      skill: s.skill,
      difficulty: s.difficulty,
      timeLimitMinutes: s.timeLimitMinutes,
      xpBase: s.xpBase,
      emailSubject: s.emailSubject,
      emailSender: s.emailSender,
      preview: s.briefing.requestType,
      client: client
        ? {
            id: client.id,
            name: client.name,
            tier: client.tier,
            sector: client.sector,
            logoInitials: client.logoInitials,
            brandColour: client.brandColour,
          }
        : null,
    };
  });

  return NextResponse.json({ scenarios: payload });
}
