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
      title: "text-4xl font-bold text-white mb-4",
      address: "font-mono text-sm text-purple-300 break-all max-w-2xl mx-auto",
      copyButton: "mt-4",
    },

    statsSection: "max-w-7xl mx-auto mb-12",

    collectionSection: "mb-12",

    backLink: {
      container: "text-center mt-8",
      link: "text-purple-400 hover:text-purple-300 transition-colors text-base font-medium no-underline",
    },

    error: {
      container: "p-12 text-center text-red-400 text-lg",
    },
  },
};
