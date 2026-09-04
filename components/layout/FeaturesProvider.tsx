"use client";

import { createContext, useContext } from "react";

const FeaturesContext = createContext({ ratingsEnabled: true });

export function FeaturesProvider({
  ratingsEnabled,
  children,
}: {
  ratingsEnabled: boolean;
  children: React.ReactNode;
}) {
  return <FeaturesContext.Provider value={{ ratingsEnabled }}>{children}</FeaturesContext.Provider>;
}

export function useFeatures() {
  return useContext(FeaturesContext);
}
