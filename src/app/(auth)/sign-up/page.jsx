const handleGoogleSignUp = async () => {
  try {
    console.log("Starting Google Sign Up Process:", {
      timestamp: new Date().toISOString(),
      currentUrl: window.location.href,
      origin: window.location.origin,
    });

    await createOAuthSession("google");

    console.log("Google Sign Up Initiated Successfully");
  } catch (error) {
    console.error("Google Sign Up Error:", {
      error: {
        code: error.code,
        message: error.message,
        type: error.type,
        response: error.response,
      },
      timestamp: new Date().toISOString(),
      currentUrl: window.location.href,
      origin: window.location.origin,
    });

    // Only show error if it's not a redirect
    if (!error.message?.includes("redirect")) {
      toast({
        title: "Error",
        description: "Failed to sign up with Google. Please try again.",
        variant: "destructive",
      });
    }
  }
};
