import { createContext, useContext, useEffect } from "react";
import { useGetSettings } from "@workspace/api-client-react";

type Theme = "dark" | "light" | "pink-light" | "dark-red" | "dark-blue" | "system";

const ThemeContext = createContext<{ theme: Theme }>({ theme: "system" });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useGetSettings();
  const theme = (settings?.theme as Theme) || "light";

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "pink-light", "dark-red", "dark-blue");
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);