import { useEffect, useState } from "react";

export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initialValue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(initialValue) && !Array.isArray(parsed)) return initialValue;
      if (parsed && initialValue && typeof parsed === "object" && !Array.isArray(parsed) && !Array.isArray(initialValue)) {
        return { ...initialValue, ...parsed };
      }
      return parsed;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore quota errors for large file uploads in this frontend-only demo.
    }
  }, [key, state]);

  return [state, setState];
}
