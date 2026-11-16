import { useEffect, useState } from "react";
import { AppState } from "react-native";

const startOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// The start of the device's current calendar day. Moves at local midnight and when the app returns to the front on a new day.
export function useToday(): Date {
  const [today, setToday] = useState(startOfToday);
  useEffect(() => {
    const refresh = () => {
      const next = startOfToday();
      if (next.getTime() !== today.getTime()) setToday(next);
    };
    const timer = setTimeout(refresh, today.getTime() + 86400000 - Date.now() + 1000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [today]);
  return today;
}
