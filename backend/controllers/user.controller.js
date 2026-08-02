import User from "../models/user.model.js";
import moment from "moment/moment.js";
import geminiResponse from "../gemini.js";
import uploadOnCloudinary from "../config/cloudinary.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
    return res.status(400).json({ message: "get current user error" });
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
      {
        assistantName,
        assistantImage,
      },
      { new: true }
    ).select("-password");
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(400).json({ message: "update assistant error" });
  }
};

// export const askAssistant = async (req, res) => {

//   console.log("Ask assistant called");
//   try {
//     const user = await User.findById(req.userId);
//     const userName = user.name;
//     const assistantName = user.assistantName;

//     const { command } = req.body;
//     user.history.push(command);
//     await user.save();
//     let result = await geminiResponse(command, assistantName, userName);

//     console.log("Gemini raw result:", result);

//     // res.json(result)
//     if (typeof result !== "string") {
//       return res.status(400).json({ message: "Invalid response from AI" });
//     }
//     const jsonMatch = result.match(/{[\s\s]*}/);

//     if (!jsonMatch) {
//       return res.status(400).json({
//         message: "Sorry, I couldn't process your request. Please try again.",
//       });
//     }

//     const gemResult = JSON.parse(jsonMatch[0]);

//     const type = gemResult.type;
//     switch (type) {
//       case "get_time":
//         return res.json({
//           type,
//           userInput: gemResult.userInput,
//           response: `Current time is ${moment().format("hh:mm A")}`,
//         });
//         break;

//       case "get_date":
//         return res.json({
//           type,
//           userInput: gemResult.userInput,
//           response: `current date is ${moment().format("DD-MM-YYYY")}`,
//         });
//         break;

//       case "get_day":
//         return res.json({
//           type,
//           userInput: gemResult.userInput,
//           response: `Today is ${moment().format("dddd")}`,
//         });
//         break;

//       case "get_month":
//         return res.json({
//           type,
//           userInput: gemResult.userInput,
//           response: `Current month is ${moment().format("MMMM")}`,
//         });
//         break;
//       case "google_search":
//       case "youtube_search":
//       case "youtube_play":
//       case "general":
//       case "calculator_open":
//       case "instagram_open":
//       case "facebook_open":
//       case "weather_show":
//         return res.json({
//           type,
//           userInput: gemResult.userInput,
//           response: gemResult.response,
//         });

//       default:
//         return res.status(500).json({
//           // type: "general",
//           // userInput: gemResult.userInput,
//           response: "Sorry, I couldn't process your request. Please try again.",
//         });
//         break;
//     }

//     // return res.status(200).json({ success: true, gemResult });
//   } catch (error) {
//     return res.status(400).json({ message: "ask assistant error" });
//   }
// };


export const askAssistant = async (req, res) => {
  console.log("\n=== Ask assistant called ===");
  
  try {
    // Step 1: Get user
    console.log("1. Finding user...");
    const user = await User.findById(req.userId);
    if (!user) {
      console.error("❌ User not found");
      return res.status(404).json({ 
        type: "error",
        response: "User not found" 
      });
    }
    console.log("✓ User found:", user.name);

    const userName = user.name;
    const assistantName = user.assistantName;

    // Step 2: Get command
    console.log("2. Getting command...");
    const { command } = req.body;
    console.log("Command:", command);

    if (!command) {
      console.error("❌ No command provided");
      return res.status(400).json({ 
        type: "error",
        response: "No command provided" 
      });
    }

    // Step 3: Save to history
    console.log("3. Saving to history...");
    user.history.push(command);
    await user.save();
    console.log("✓ Saved to history");

    // Step 4: Call Gemini
    console.log("4. Calling geminiResponse...");
    let result;
    try {
      result = await geminiResponse(command, assistantName, userName);
      console.log("✓ Gemini responded");
      console.log("Raw result:", result);
    } catch (geminiError) {
      console.error("❌ Gemini API Error:");
      console.error("Error message:", geminiError.message);
      console.error("Error stack:", geminiError.stack);
      
      // Return a proper error response instead of 400
      return res.status(500).json({
        type: "error",
        response: "AI service is currently unavailable. Please try again."
      });
    }

    // Step 5: Validate result
    console.log("5. Validating result...");
    if (typeof result !== "string") {
      console.error("❌ Result is not a string, type:", typeof result);
      return res.status(500).json({ 
        type: "error",
        response: "Invalid response from AI" 
      });
    }
    console.log("✓ Result is a string");

    // Step 6: Parse JSON
    console.log("6. Parsing JSON...");
    const jsonMatch = result.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      console.error("❌ No JSON found in result");
      console.error("Result was:", result);
      return res.status(500).json({
        type: "error",
        response: "Sorry, I couldn't understand the AI response. Please try again.",
      });
    }
    console.log("✓ JSON found:", jsonMatch[0]);

    let gemResult;
    try {
      gemResult = JSON.parse(jsonMatch[0]);
      console.log("✓ Parsed successfully:", gemResult);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError.message);
      return res.status(500).json({
        type: "error",
        response: "Failed to parse AI response. Please try again.",
      });
    }

    // Step 7: Handle response
    console.log("7. Handling response type:", gemResult.type);
    const type = gemResult.type;
    
    switch (type) {
      case "get_time":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Current time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        });

      case "get_date":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Current date is ${new Date().toLocaleDateString('en-GB')}`,
        });

      case "get_day":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`,
        });

      case "get_month":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Current month is ${new Date().toLocaleDateString('en-US', { month: 'long' })}`,
        });

      case "google_search":
      case "youtube_search":
      case "youtube_play":
      case "general":
      case "calculator_open":
      case "instagram_open":
      case "facebook_open":
      case "weather_show":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: gemResult.response,
        });

      default:
        console.warn("⚠️ Unknown type:", type);
        return res.json({
          type: "general",
          userInput: gemResult.userInput || command,
          response: gemResult.response || "I'm not sure how to help with that.",
        });
    }

  } catch (error) {
    console.error("\n❌ ERROR IN askAssistant:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=== End Error ===\n");
    
    return res.status(500).json({ 
      type: "error",
      response: "Server error occurred. Please try again." 
    });
  }
};