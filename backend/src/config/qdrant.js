// comment: import QdrantClient from @qdrant/js-client-rest

import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";
dotenv.config();


// comment: initialize a QdrantClient instance using QDRANT_URL (and QDRANT_API_KEY if set, optional for local docker)
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});


// comment: create and export an async function ensureCollection(collectionName, vectorSize) that:
const ensureCollection = async (collectionName, vectorSize) => {
  try {
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (col) => col.name === collectionName
    );
    if (!collectionExists) {
      await qdrantClient.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: "Cosine"
        }
      });
      console.log(`Collection created: ${collectionName}`);
    } else {
      console.log(`Collection already exists: ${collectionName}`);
    }
  } catch (error) {
    console.error("Error ensuring collection:", error);
    process.exit(1);
  }
};



// comment: export the qdrantClient instance as default/named export for reuse across vector-store/ files
export { qdrantClient, ensureCollection };