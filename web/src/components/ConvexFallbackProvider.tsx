"use client";

import { ReactNode, createContext, useContext } from "react";

// Context for handling Convex availability
const ConvexFallbackContext = createContext({
  isConvexAvailable: false,
});

export function ConvexFallbackProvider({ children }: { children: ReactNode }) {
  // Check if Convex URL is properly configured
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const isConvexAvailable = convexUrl && !convexUrl.includes('your-deployment-url');

  return (
    <ConvexFallbackContext.Provider value={{ isConvexAvailable }}>
      {children}
    </ConvexFallbackContext.Provider>
  );
}

export function useConvexFallback() {
  return useContext(ConvexFallbackContext);
}