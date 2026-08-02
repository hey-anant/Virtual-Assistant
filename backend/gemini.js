import { GoogleGenAI } from "@google/genai";
import axios from "axios";

const geminiResponse = async (command, assistantName, userName) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }

    const prompt = `You are ${assistantName}, a virtual assistant created by ${userName}.

Parse this voice command and return ONLY valid JSON (no markdown, no code blocks):

Command: "${command}"

Return this exact format:
{"type":"TYPE","userInput":"QUERY","response":"MESSAGE"}

Types:
- youtube_search/youtube_play: "open youtube", "play [something]", "search youtube for [something]"
- google_search: "search for", "google [something]", "find information about"
- get_time: "what time", "tell me the time", "current time"
- get_date: "what date", "today's date", "what's the date"
- get_day: "what day", "which day is it", "today is"
- get_month: "what month", "which month", "current month"
- calculator_open: "open calculator", "calculator"
- instagram_open: "open instagram", "instagram"
- facebook_open: "open facebook", "facebook"
- weather_show: "weather", "temperature", "how's the weather"
- general: everything else (greetings, questions, chitchat)

Rules:
1. For searches: userInput should be ONLY the search query (remove "search for", "google", etc.)
2. Remove the assistant name from userInput if present
3. Keep response short and natural (max 10 words)
4. If someone asks who created you, mention ${userName}

Now parse: "${command}"
JSON response:`;

    console.log("Calling Gemini API...");
    let text = "";

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      text = response.text ? response.text.trim() : "";
    } catch (sdkErr) {
      console.warn("SDK call failed, trying direct v1beta endpoint...", sdkErr.message);
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
      const result = await axios.post(
        apiUrl,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey } }
      );
      text = result.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    }

    console.log("Gemini raw response:", text);

    // Clean up the response
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/`/g, "")
      .trim();

    if (!text.startsWith("{")) {
      const jsonMatch = text.match(/{[\s\S]*}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      } else {
        const fallbackResponse = {
          type: "general",
          userInput: command,
          response: text || "I'm here to help!",
        };
        text = JSON.stringify(fallbackResponse);
      }
    }

    return text;
  } catch (error) {
    console.error("Error fetching Gemini response:", error.message);
    
    // Fail-safe command parser fallback if AI service is temporarily unreachable
    const cmdLower = (command || "").toLowerCase();
    let fallback = { type: "general", userInput: command, response: "I am here to help you!" };

    if (cmdLower.includes("youtube")) {
      fallback = { type: "youtube_search", userInput: command.replace(/open|search|play|youtube/gi, "").trim() || "youtube", response: "Opening YouTube for you" };
    } else if (cmdLower.includes("google") || cmdLower.includes("search")) {
      fallback = { type: "google_search", userInput: command.replace(/google|search|for/gi, "").trim() || "search", response: "Searching on Google" };
    } else if (cmdLower.includes("time")) {
      fallback = { type: "get_time", userInput: "time", response: "Let me check the time" };
    } else if (cmdLower.includes("date")) {
      fallback = { type: "get_date", userInput: "date", response: "Let me check the date" };
    } else if (cmdLower.includes("calculator")) {
      fallback = { type: "calculator_open", userInput: "calculator", response: "Opening calculator" };
    } else if (cmdLower.includes("instagram")) {
      fallback = { type: "instagram_open", userInput: "instagram", response: "Opening Instagram" };
    } else if (cmdLower.includes("facebook")) {
      fallback = { type: "facebook_open", userInput: "facebook", response: "Opening Facebook" };
    } else if (cmdLower.includes("weather")) {
      fallback = { type: "weather_show", userInput: "weather", response: "Checking weather forecast" };
    }

    return JSON.stringify(fallback);
  }
};

export default geminiResponse;
