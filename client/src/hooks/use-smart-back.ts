import { useLocation } from "wouter";

export function useSmartBack(fallback: string) {
  const [, setLocation] = useLocation();

  const goBack = (path?: string) => {
    setLocation(path || fallback);
  };

  return { goBack };
}

export function useNavigationTracker() {
  // Simplified navigation tracker - no complex history management
  return;
}
