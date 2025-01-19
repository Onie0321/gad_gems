export const checkNetworkStatus = async () => {
  if (!navigator.onLine) {
    return {
      isOnline: false,
      message:
        "No internet connection detected. Please check your network connection.",
    };
  }

  try {
    const start = performance.now();
    const response = await fetch("https://www.google.com/favicon.ico", {
      mode: "no-cors",
      cache: "no-store",
    });
    const end = performance.now();
    const latency = end - start;

    if (latency > 3000) {
      return {
        isOnline: true,
        isLow: true,
        message:
          "Slow internet connection detected. Data loading may take longer than usual.",
      };
    }

    return {
      isOnline: true,
      isLow: false,
      message: "",
    };
  } catch (error) {
    return {
      isOnline: false,
      message: "Network error detected. Please check your internet connection.",
    };
  }
};
