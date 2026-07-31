import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import cookieParser from 'cookie-parser';
import cors from "cors"
import geminiResponse from './gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

console.log("MongoDB URI:", process.env.MONGODB_URI);
connectDB();


const app = express();
app.use(express.json());

app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}))

app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
const PORT = process.env.PORT || 3000;

app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);

app.get("/", async (req,res)=>{
    let prompt=req.query.command;
    let data = await geminiResponse(prompt, "Assistant", "User");
    res.json(data);
})

app.listen(PORT, () => {
    
    console.log(`Server is running on port:${PORT}`);
});