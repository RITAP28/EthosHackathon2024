import axios from "axios";

export const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    // server gives a response with status code outside 2xx
    if (error.response) {
      console.error("Server Error: ", error.response.data);
      return {
        message:
          error.response.data?.message || "An error occured on the server",
        status: error.response.status,
      };
    } else if (error.request) {
      // Request was made but no response was received
      console.error("No response: ", error.request);
      return {
        message:
          "No response received from the server. Please try again later.",
      };
    }
  }
  // Fallback for non-Axios errors
  console.error("Unexpected Error:", error);
  return {
    message: "An unexpected error occurred. Please try again later.",
  };
};
