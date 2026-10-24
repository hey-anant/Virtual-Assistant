/**
 * Offline keyword-based command parser.
 * Used as a fallback when the Gemini AI API is unreachable.
 * @param {string} command - The raw voice/text command from the user.
 * @returns {string} JSON string with { type, userInput, response }
 */
const parseCommandOffline = (command) => {
    const cmdLower = (command || '').toLowerCase();
    // Strip common filler words to extract the actual search query
    const cleanQuery = command
        .replace(/^(search|search for|google|find|look up|what is|who is|how to|tell me about)\s+/i, '')
        .trim() || command;

    let fallback = { type: 'general', userInput: command, response: 'I am here to help you!' };

    if (cmdLower.includes('youtube') || cmdLower.includes('play') || cmdLower.includes('watch')) {
        fallback = {
            type: 'youtube_search',
            userInput: command.replace(/open|search|play|watch|youtube/gi, '').trim() || 'youtube',
            response: 'Opening YouTube for you',
        };
    } else if (
        cmdLower.includes('weather') || cmdLower.includes('temperature') ||
        cmdLower.includes('forecast') || cmdLower.includes('how hot') || cmdLower.includes('how cold')
    ) {
        fallback = { type: 'weather_show', userInput: cleanQuery, response: 'Checking weather forecast' };
    } else if (cmdLower.includes('instagram')) {
        fallback = { type: 'instagram_open', userInput: 'instagram', response: 'Opening Instagram' };
    } else if (cmdLower.includes('facebook')) {
        fallback = { type: 'facebook_open', userInput: 'facebook', response: 'Opening Facebook' };
    } else if (cmdLower.includes('calculator') || cmdLower.includes('calculate')) {
        fallback = { type: 'calculator_open', userInput: 'calculator', response: 'Opening calculator' };
    } else if (cmdLower.match(/\btime\b/)) {
        fallback = { type: 'get_time', userInput: 'time', response: 'Let me check the time' };
    } else if (cmdLower.match(/\bdate\b/)) {
        fallback = { type: 'get_date', userInput: 'date', response: 'Let me check the date' };
    } else if (cmdLower.match(/\bday\b/)) {
        fallback = { type: 'get_day', userInput: 'day', response: 'Let me check the day' };
    } else if (cmdLower.match(/\bmonth\b/)) {
        fallback = { type: 'get_month', userInput: 'month', response: 'Let me check the month' };
    } else if (
        // Treat any question or lookup phrase as a Google search
        cmdLower.includes('search') || cmdLower.includes('google') ||
        cmdLower.includes('find') || cmdLower.includes('look up') ||
        cmdLower.startsWith('what') || cmdLower.startsWith('who') ||
        cmdLower.startsWith('how') || cmdLower.startsWith('why') ||
        cmdLower.startsWith('where') || cmdLower.startsWith('when')
    ) {
        fallback = {
            type: 'google_search',
            userInput: cleanQuery,
            response: 'Searching on Google',
        };
    }

    return JSON.stringify(fallback);
};

export default parseCommandOffline;
