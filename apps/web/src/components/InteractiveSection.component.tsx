"use client";

import { useState } from "react";
import { Collection } from "./Collection.component";
import { SummonButton } from "./SummonButton.component";
import { ViewCollectionButton } from "./ViewCollectionButton.component";

interface InteractiveSectionProps {
  summonSectionStyles: string;
  collectionSectionStyles: string;
}

export function InteractiveSection({
  summonSectionStyles,
  collectionSectionStyles,
}: InteractiveSectionProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSummonComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <div className={summonSectionStyles}>
        <SummonButton onSummonComplete={handleSummonComplete} />
        <ViewCollectionButton />
      </div>

      <div className={collectionSectionStyles}>
        <Collection refreshTrigger={refreshTrigger} showOwnCollectionOnly />
      </div>
    </>
  );
}
