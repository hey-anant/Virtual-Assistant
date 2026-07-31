import axios from "axios";

const geminiResponse = async (command, assistantName, userName) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

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

Examples:
Input: "open youtube" → {"type":"youtube_search","userInput":"youtube","response":"Opening YouTube for you"}
Input: "search for cat videos" → {"type":"google_search","userInput":"cat videos","response":"Searching for cat videos"}
Input: "what time is it" → {"type":"get_time","userInput":"what time is it","response":"Let me check the time"}
Input: "hello" → {"type":"general","userInput":"hello","response":"Hello! How can I help?"}
Input: "who made you" → {"type":"general","userInput":"who made you","response":"I was created by ${userName}"}

Now parse: "${command}"
JSON response:`;

    console.log("Calling Gemini API...");
    const result = await axios.post(
      apiUrl,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 200,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
      }
    );

    let text = result.data.candidates[0].content.parts[0].text.trim();
    console.log("Gemini raw response:", text);

    // Clean up the response
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/`/g, "")
      .trim();

    // If response doesn't start with {, try to find JSON in the text
    if (!text.startsWith("{")) {
      const jsonMatch = text.match(/{[\s\S]*}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      } else {
        // Create fallback JSON if no JSON found
        console.warn("No JSON found, creating fallback");
        const fallbackResponse = {
          type: "general",
          userInput: command
            .replace(new RegExp(assistantName, "gi"), "")
            .trim(),
          response: text || "I'm here to help!",
        };
        text = JSON.stringify(fallbackResponse);
      }
    }

    console.log("Cleaned response:", text);
    return text;
  } catch (error) {
    console.error("Error fetching Gemini response:");
    console.error("Message:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    throw error;
  }
};

export default geminiResponse;
