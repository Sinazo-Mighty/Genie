// Environment variables for API keys
// In production, these should be loaded from secure environment variables

export const ENV = {
  // OpenAI API Configuration
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  OPENAI_MODEL: "gpt-4o-mini",

  // Google Cloud Vision API Configuration
  GOOGLE_VISION_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || "",

  // Gemini API Configuration
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
  GEMINI_MODEL: "gemini-1.5-flash",

  // Backend API
  BACKEND_API_URL: process.env.EXPO_PUBLIC_BACKEND_API_URL || "http://localhost:5001/api",
}
