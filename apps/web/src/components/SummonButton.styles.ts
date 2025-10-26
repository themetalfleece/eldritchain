export const styles = {
  container: "flex flex-col items-center gap-4",

  notConnectedContainer: "text-center",
  notConnectedText: "text-gray-400 mb-4",

  button: "px-12 py-6 text-2xl font-bold rounded-lg transition-all",
  buttonEnabled:
    "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transform hover:scale-105",
  buttonDisabled: "bg-gray-700 text-gray-400 cursor-not-allowed",

  timerContainer: "text-gray-400",
  timerValue: "text-purple-400 font-mono",
  statusContainer: "text-gray-400 text-sm max-w-md text-center",

  errorMessage: "text-red-400 text-sm max-w-md text-center",
  successMessage: "text-green-400 text-sm",
};
