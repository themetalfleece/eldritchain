export const styles = {
  container: "min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900",

  header: {
    container: "border-b border-purple-800/30 bg-slate-900/50 backdrop-blur-sm",
    inner: "container mx-auto px-4 py-4 flex items-center justify-between",
    title:
      "text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity",
  },

  main: {
    container: "container mx-auto px-4 py-12",

    hero: {
      container: "text-center mb-12",
      title: "text-4xl font-bold text-white mb-4",
      address: "font-mono text-sm text-purple-300 break-all max-w-2xl mx-auto",
    },

    collectionSection: "mb-12",

    backLink: {
      container: "text-center mt-8",
      link: "text-purple-400 hover:text-purple-300 transition-colors text-base font-medium no-underline",
    },

    error: {
      container: "p-12 text-center text-red-400 text-lg",
    },
  },

  footer: {
    container:
      "border-t border-purple-800/30 bg-slate-900/50 backdrop-blur-sm py-6 text-center text-purple-300/70 text-sm mt-auto",
  },
};
