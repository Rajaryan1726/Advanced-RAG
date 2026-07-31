// comment: import Redis from ioredis
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();



// comment: create and export a single shared ioredis connection instance using REDIS_URL
const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
// comment: this instance will be passed into BullMQ Queue and Worker constructors (they require an ioredis-compatible connection)




// comment: add 'connect' and 'error' event listeners for logging connection status
redisConnection.on("connect", () => {
  console.log("Connected to Redis");
});
redisConnection.on("error", (error) => {
  console.error("Error connecting to Redis:", error);
});



// comment: export the connection instance as default export
export default redisConnection;