import User from '../models/user.model.js';
import geminiResponse from '../gemini.js';
import uploadOnCloudinary from '../config/cloudinary.js';

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                assistantImage: user.assistantImage,
                assistantName: user.assistantName,
                history: user.history || [],
            },
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to get current user' });
    }
};

export const updateAssistant = async (req, res) => {
    try {
        const { assistantName, imageUrl } = req.body;
        let assistantImage;

        if (req.file) {
            assistantImage = await uploadOnCloudinary(req.file.path);
        } else {
            assistantImage = imageUrl;
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { assistantName, assistantImage },
            { new: true }
        ).select('-password');

        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update assistant' });
    }
};

export const askAssistant = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ type: 'error', response: 'User not found' });
        }

        const { command } = req.body;
        if (!command) {
            return res.status(400).json({ type: 'error', response: 'No command provided' });
        }

        user.history.push(command);
        await user.save();

        let result;
        try {
            result = await geminiResponse(command, user.assistantName, user.name);
        } catch (geminiError) {
            console.error('Gemini API error:', geminiError.message);
            return res.status(500).json({
                type: 'error',
                response: 'AI service is currently unavailable. Please try again.',
            });
        }

        if (typeof result !== 'string') {
            return res.status(500).json({ type: 'error', response: 'Invalid response from AI' });
        }

        const jsonMatch = result.match(/{[\s\S]*}/);
        if (!jsonMatch) {
            return res.status(500).json({
                type: 'error',
                response: "Sorry, I couldn't understand the AI response. Please try again.",
            });
        }

        let gemResult;
        try {
            gemResult = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            return res.status(500).json({
                type: 'error',
                response: 'Failed to parse AI response. Please try again.',
            });
        }

        const type = gemResult.type;

        switch (type) {
            case 'get_time':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `Current time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                });

            case 'get_date':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `Current date is ${new Date().toLocaleDateString('en-GB')}`,
                });

            case 'get_day':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`,
                });

            case 'get_month':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `Current month is ${new Date().toLocaleDateString('en-US', { month: 'long' })}`,
                });

            case 'google_search':
            case 'youtube_search':
            case 'youtube_play':
            case 'general':
            case 'calculator_open':
            case 'instagram_open':
            case 'facebook_open':
            case 'weather_show':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: gemResult.response,
                });

            default:
                return res.json({
                    type: 'general',
                    userInput: gemResult.userInput || command,
                    response: gemResult.response || "I'm not sure how to help with that.",
                });
        }
    } catch (error) {
        console.error('askAssistant error:', error.message);
        return res.status(500).json({ type: 'error', response: 'Server error occurred. Please try again.' });
    }
};
