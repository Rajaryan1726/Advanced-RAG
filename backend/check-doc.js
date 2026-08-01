import { connectMongoDB } from './src/config/mongodb.js';
import Document from './src/models/Document.js';
import mongoose from 'mongoose';

const runCheck = async () => {
  await connectMongoDB();
const doc = await Document.findOne({ originalFilename: '01_what-is-mobile-development_epm.vtt' }).sort({ createdAt: -1 });
  console.log(doc);
  await mongoose.disconnect();
  process.exit(0);
};

runCheck();