import mongoose from "mongoose";

const MONGO_URL = process.env.MONGO_URL ?? "mongodb://localhost:27018/athenaeum";

export async function connectDb(): Promise<typeof mongoose> {
    return mongoose.connect(MONGO_URL);
}
