import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const mongoURL = process.env.MONGO_URL as string;

export default function connectToDatabase() {
  mongoose
    .connect(mongoURL)
    .then((data) => console.log(`MongoDB has been connected successfully, ${data.connection.host}`))
    .catch((err) => console.log(err));
};
