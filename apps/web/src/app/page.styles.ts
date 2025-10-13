export const styles = {
  container: "min-h-screen bg-gradient-to-b from-gray-900 to-black",

  header: {
    container: "container mx-auto px-4 py-6",
    inner: "flex justify-between items-center",
    title:
      "text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent",
  },

  main: {
    container: "container mx-auto px-4 py-12",
    hero: {
      container: "text-center mb-12",
      title: "text-5xl font-bold mb-4",
      description: "text-gray-400 text-lg max-w-2xl mx-auto",
    },
    summonSection: "flex justify-center mb-16",
    collectionSection: "max-w-7xl mx-auto",
  },

  footer: {
    container: "container mx-auto px-4 py-8 text-center text-gray-500 text-sm",
  },
};
