import clsx from "clsx";

export const styles = {
  container: "w-full max-w-md mx-auto bg-gray-800 p-4 rounded-lg shadow-lg mb-6",
  title: "text-xl font-bold text-white mb-4 text-center",

  levelSection: "mb-6",
  levelItem:
    "flex flex-col items-center justify-center p-3 bg-gray-700 rounded-md border-2 border-yellow-400/30",

  statsGrid: "grid grid-cols-2 sm:grid-cols-4 gap-4",
  statItem: "flex flex-col items-center justify-center p-2 bg-gray-700 rounded-md",
  statValue: "text-2xl font-bold",
  statLabel: "text-sm text-gray-400",
  loadingText: "text-gray-400 text-lg text-center",

  progressBar: "w-full h-2 bg-gray-600 rounded-full mt-2 overflow-hidden",
  progressFill: "h-full bg-gradient-to-r from-yellow-400 to-yellow-300 transition-all duration-300",

  // Level-specific styles
  levelValue: (className?: string) => clsx("text-2xl font-bold text-yellow-400", className),
  levelScore: (className?: string) => clsx("text-sm text-gray-400", className),
  levelScoreNext: (className?: string) => clsx("text-xs text-gray-500", className),

  // Rarity-specific styles
  rarityValue: (rarityColor: string, className?: string) =>
    clsx("text-2xl font-bold", rarityColor, className),
};
