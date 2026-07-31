import mongoose from "mongoose";

const connectDB = async () => {
    try {
        
        // Set up connection event listeners before connecting
        mongoose.connection.on("connected", () => {
            console.log("MongoDB connected successfully");
        });

        // mongoose.connection.on("error", (err) => {
        //     console.error("MongoDB connection error:", err);
        // });

        // mongoose.connection.on("disconnected", () => {
        //     console.log("MongoDB disconnected");
        // });

        // Connect to MongoDB
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'virtualAssistant' // Specify database name as an option
        });

        // console.log(`MongoDB Connected: ${conn.connection.host}`);
        
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;