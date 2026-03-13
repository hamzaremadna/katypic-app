import { useQuery } from "@tanstack/react-query";
import { aiApi, DailyTip } from "../services/api/ai.api";

const FALLBACK_TIPS: DailyTip[] = [
  {
    tip: "Utilisez la règle des tiers pour des compositions plus dynamiques.",
    category: "composition",
  },
  {
    tip: "Photographiez pendant l'heure dorée pour une lumière chaude et flatteuse.",
    category: "lumiere",
  },
  {
    tip: "Essayez de vous baisser ou de monter en hauteur pour un angle original.",
    category: "creativite",
  },
  {
    tip: "Nettoyez votre objectif avant chaque session pour des photos plus nettes.",
    category: "technique",
  },
  {
    tip: "Cherchez les couleurs complémentaires dans votre scène pour plus d'impact.",
    category: "couleur",
  },
];

function getRandomFallback(): DailyTip {
  const idx = new Date().getDate() % FALLBACK_TIPS.length;
  return FALLBACK_TIPS[idx];
}

export function useDailyTip() {
  return useQuery({
    queryKey: ["dailyTip"],
    queryFn: () => aiApi.getDailyTip().then((r) => r.data),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
    placeholderData: getRandomFallback(),
  });
}
