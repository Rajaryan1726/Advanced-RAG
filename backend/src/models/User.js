// comment: import mongoose (Schema, model) from "mongoose"

import mongoose from "mongoose";

const { Schema, model } = mongoose;

// comment: define a UserSchema with:
//   - clerkUserId: String, required, unique — this is the link to Clerk, NOT storing passwords/credentials
//   - email: String (optional cache of Clerk's email, useful for quick lookups without calling Clerk API)
//   - preferences: an object for app-specific settings, e.g. { preferredProvider: String, defaultTopK: Number }
//   - createdAt: Date, default Date.now

const UserSchema = new Schema({
  clerkUserId: { type: String, required: true, unique: true },
  email: { type: String },  
  preferences: { type: Object },
  
}, 
{ timestamps: true 

}
);


// comment: create and export the Mongoose model: export default mongoose.model("User", UserSchema)

export default model("User", UserSchema);