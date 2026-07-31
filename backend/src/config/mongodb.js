// comment: import mongoose and the config object from ./env.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// comment: create and export an async function connectMongoDB() that connects to MONGODB_URI using mongoose.connect()
export const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// comment: optionally add mongoose connection event listeners for 'disconnected' and 'reconnected' for visibility in logs
const db = mongoose.connection;
db.on("disconnected", () => {
  console.log("MongoDB disconnected");
}); 
db.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

