import * as React from "react";

type PlaceholderPageProps = {
  title: string;
  sprint: string;
  description: string;
};

export function PlaceholderPage({
  title,
  sprint,
  description,
}: PlaceholderPageProps): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-3 rounded-xl border border-dashed p-10">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {sprint}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
