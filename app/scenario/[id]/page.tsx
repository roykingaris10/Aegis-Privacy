import * as React from "react";
import { notFound } from "next/navigation";

import { ScenarioWorkspace } from "@/components/scenario/scenario-workspace";
import { requireClientById } from "@/lib/clients";
import { getScenarioById } from "@/lib/scenarios";

type Props = {
  params: { id: string };
};

export default function ScenarioPage({ params }: Props): React.ReactElement {
  const scenario = getScenarioById(params.id);
  if (!scenario) notFound();

  const client = requireClientById(scenario.client);

  return <ScenarioWorkspace scenario={scenario} client={client} />;
}
