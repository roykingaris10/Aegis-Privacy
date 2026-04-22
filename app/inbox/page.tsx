import * as React from "react";

import { InboxClient } from "@/components/inbox/inbox-client";
import type { InboxScenario } from "@/components/inbox/inbox-types";
import { requireClientById } from "@/lib/clients";
import { getAllScenarios } from "@/lib/scenarios";

export default function InboxPage(): React.ReactElement {
  const scenarios: ReadonlyArray<InboxScenario> = getAllScenarios().map(
    (s) => ({
      ...s,
      clientRecord: requireClientById(s.client),
    }),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <InboxClient scenarios={scenarios} />
    </div>
  );
}
