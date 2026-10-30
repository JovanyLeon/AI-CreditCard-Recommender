import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../api/client";
import type {
  RecommendationRequest,
  RecommendationResponse,
} from "../types/recommendation";
import { defaultPreferences } from "./preferences";

interface MatchState {
  preferences: RecommendationRequest;
  setPreferences: (value: RecommendationRequest) => void;
  result: RecommendationResponse | null;
  pending: boolean;
  error: string | null;
  findMatches: (value?: RecommendationRequest) => Promise<void>;
  reset: () => void;
}
const MatchContext = createContext<MatchState | null>(null);
export function MatchProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  async function findMatches(value = preferences) {
    const id = ++requestId.current;
    setPreferences(value);
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const response = await api.recommend(value);
      if (id === requestId.current) setResult(response);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      if (id === requestId.current) setPending(false);
    }
  }
  function reset() {
    requestId.current++;
    setPending(false);
    setPreferences(defaultPreferences());
    setResult(null);
    setError(null);
  }
  return (
    <MatchContext.Provider
      value={{
        preferences,
        setPreferences,
        result,
        pending,
        error,
        findMatches,
        reset,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}
export function useMatch() {
  const context = useContext(MatchContext);
  if (!context) throw new Error("MatchProvider is required");
  return context;
}
