"use client";

import { SummonButton } from "./SummonButton.component";
import { ViewCollectionButton } from "./ViewCollectionButton.component";

interface InteractiveSectionProps {
  summonSectionStyles: string;
}

export function InteractiveSection({ summonSectionStyles }: InteractiveSectionProps) {
  return (
    <div className={summonSectionStyles}>
      <SummonButton />
      <ViewCollectionButton />
    </div>
  );
}
