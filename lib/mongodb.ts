import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error('Please define MONGODB_URI in your .env file')
}

const mongoUri: string = uri

const options = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createMongoClient() {
  const client = new MongoClient(mongoUri, options);

  const promise = client.connect().catch((error) => {
    // Remove the failed connection so the next request can reconnect.
    global._mongoClientPromise = undefined;

    console.error("MongoDB connection failed:", error);

    throw error;
  });

  global._mongoClientPromise = promise;

  return promise;
}

const clientPromise =
  global._mongoClientPromise ?? createMongoClient();

export default clientPromise;