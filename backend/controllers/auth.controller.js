import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import genToken from '../config/token.js';

const isProduction = process.env.NODE_ENV === 'production';

export const signUp = async (req, res) => {
    try {
        console.log("Request body:", req.body);
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            console.log("Email already exists");
            return res.status(400).json({ message: "Email already exists" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ name, email, password: hashedPassword });

        const token = genToken(user?._id);
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                _id: user?._id,
                name: user?.name,
                email: user?.email,
                isAdmin: user?.isAdmin,
                assistantName: user?.assistantName,
                assistantImage: user?.assistantImage,
                token
            }
        });

    } catch (error) {
        console.error("SignUp error:", error);
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    }
}


export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const isMatched = await bcrypt.compare(password, user.password);

        if (!isMatched) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = genToken(user?._id);
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            message: "User Logged in successfully",
            user: {
                _id: user?._id,
                name: user?.name,
                email: user?.email,
                isAdmin: user?.isAdmin,
                assistantName: user?.assistantName,
                assistantImage: user?.assistantImage,
                token
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    }
}


export const Logout = async (req, res) => {
    try {
        await res.clearCookie('token', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });

        res.status(200).json({ message: "User logged out successfully" });

    } catch (error) {
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    }
}
