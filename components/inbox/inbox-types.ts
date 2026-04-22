import type { Scenario } from "@/lib/scenarios";
import type { Client } from "@/lib/clients";

export type InboxScenario = Scenario & { clientRecord: Client };
