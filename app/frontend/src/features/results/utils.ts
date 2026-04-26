export const ERROR_COPY: Record<string, { title: string; body: string }> = {
  "400": {
    title: "Invalid Trip Details",
    body: "One or more addresses could not be found. Please check your locations and try again.",
  },
  "422": {
    title: "Route Unavailable",
    body: "No truck-accessible route exists between those locations. HGV restrictions may apply.",
  },
  "503": {
    title: "Routing Service Unavailable",
    body: "The mapping service is temporarily down. Please wait and try again.",
  },
  default: {
    title: "Something Went Wrong",
    body: "An unexpected error occurred during simulation.",
  },
};