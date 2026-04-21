import * as React from "react";
import { PlaceholderPage } from "@/components/placeholder-page";

type ScenarioPageProps = {
  params: { id: string };
};

export default function ScenarioPage({
  params,
}: ScenarioPageProps): React.ReactElement {
  return (
    <PlaceholderPage
      title={`Scenario: ${params.id}`}
      sprint="Sprint 2"
      description="Scenario workspace with simulated email, response editor, and AI coach panel. Coming in Sprint 2."
    />
  );
}
