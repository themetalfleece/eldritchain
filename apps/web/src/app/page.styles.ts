export const styles = {
  container: "",

  header: {
    container: "container mx-auto px-4 py-6",
    inner: "flex justify-between items-center",
    title:
      "text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity",
  },

  main: {
    container: "container mx-auto px-4 py-12",
    hero: {
      container: "text-center mb-12",
      title: "text-5xl font-bold mb-4",
      description: "text-gray-400 text-lg max-w-2xl mx-auto",
      note: "mt-6 p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/20 max-w-3xl mx-auto",
      noteText: "text-sm text-gray-300",
    },
    statsSection: "max-w-7xl mx-auto mb-16",
    summonSection: "flex flex-col items-center mb-16",
    collectionSection: "max-w-7xl mx-auto mb-16",
    recentSummonsSection: "max-w-7xl mx-auto mb-16",
    leaderboardSection: "max-w-7xl mx-auto mb-16",
  },
};
