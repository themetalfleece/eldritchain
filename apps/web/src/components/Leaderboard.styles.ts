export const styles = {
  container: "w-full max-w-4xl mx-auto",
  title:
    "text-3xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent",

  loading: "text-center py-12 text-purple-300 text-lg",
  error: "text-center py-12 text-red-400 text-lg",

  empty: "text-center py-12",
  emptyText: "text-2xl font-semibold text-purple-200 mb-2",
  emptySubtext: "text-purple-400",

  table: {
    container:
      "bg-slate-800/50 rounded-lg border border-purple-800/30 overflow-hidden backdrop-blur-sm",

    header:
      "grid grid-cols-7 gap-4 p-4 bg-slate-900/70 border-b border-purple-800/30 font-semibold text-purple-200 text-sm",

    body: "divide-y divide-purple-800/20",

    row: "grid grid-cols-7 gap-4 p-4 hover:bg-purple-900/20 transition-colors cursor-pointer no-underline",

    cell: {
      rank: "text-yellow-400 font-bold",
      address: "font-mono text-purple-300 truncate",
      count: "text-center",
      total: "text-center font-semibold text-purple-100",
    },
  },

  rarity: {
    deity: "text-yellow-400 font-bold",
    epic: "text-purple-400 font-semibold",
    rare: "text-blue-400",
    common: "text-gray-400",
  },
};
