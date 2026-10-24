import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import parseCommandOffline from './utils/commandParser.js';

/**
 * Builds the structured prompt sent to Gemini.
 */
const buildPrompt = (command, assistantName, userName) => `You are ${assistantName}, a virtual assistant created by ${userName}.

Your ONLY job is to classify the command below and return a JSON object. No explanation. No markdown. Raw JSON only.

Command: "${command}"

Return EXACTLY this JSON format:
{"type":"TYPE","userInput":"QUERY","response":"REPLY"}

TYPE must be one of these — choose the BEST match:
- "google_search"    → any question, search, "what is", "who is", "how to", "find", "look up", "search for", or ANY general knowledge query
- "youtube_search"  → "play", "open youtube", "watch", "search youtube", "youtube video"
- "youtube_play"    → same as youtube_search
- "get_time"        → "what time", "current time", "time now"
- "get_date"        → "what date", "today's date", "date today"
- "get_day"         → "what day", "which day", "day today"
- "get_month"       → "what month", "current month"
- "calculator_open" → "calculator", "open calculator", "calculate"
- "instagram_open"  → "instagram", "open instagram"
- "facebook_open"   → "facebook", "open facebook"
- "weather_show"    → "weather", "temperature", "forecast", "how hot", "how cold"
- "general"         → ONLY for greetings like "hello", "hi", "how are you", "who are you", "who made you"

STRICT RULES:
1. If the command is a question or contains a topic to look up → use "google_search"
2. userInput must be ONLY the search query — strip words like "search", "find", "google", "for", "look up", the assistant name
3. response must be short and natural (under 10 words)
4. If asked who created you → mention ${userName} in response, type = "general"
5. NEVER return markdown, code fences, or extra text — ONLY the raw JSON object

Command to classify: "${command}"
JSON:`;

/**
 * Cleans raw text returned by Gemini to extract a valid JSON string.
 */
const extractJson = (text, command) => {
    const cleaned = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/`/g, '')
        .trim();

    if (cleaned.startsWith('{')) return cleaned;

    const jsonMatch = cleaned.match(/{[\s\S]*}/);
    if (jsonMatch) return jsonMatch[0];

    return JSON.stringify({ type: 'general', userInput: command, response: cleaned || "I'm here to help!" });
};

/**
 * Calls the Gemini AI API and returns a structured JSON string.
 * Falls back to offline keyword parsing if the API is unreachable.
 */
const geminiResponse = async (command, assistantName, userName) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not found in environment variables');

    const prompt = buildPrompt(command, assistantName, userName);

    try {
        let text = '';

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            text = response.text ? response.text.trim() : '';
        } catch (sdkErr) {
            console.warn('Gemini SDK failed, trying REST fallback:', sdkErr.message);
            const result = await axios.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
                { contents: [{ parts: [{ text: prompt }] }] },
                { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey } }
            );
            text = result.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        }

        return extractJson(text, command);
    } catch (error) {
        console.error('Gemini API error:', error.message);
        return parseCommandOffline(command);
    }
};

export default geminiResponse;
