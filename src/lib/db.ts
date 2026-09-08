import mongoose from 'mongoose';

/**
 * Read at call time, not at import time: the worker loads .env.local after this
 * module has already been evaluated (imports are hoisted), so a top-level read
 * would silently fall back to localhost.
 */
function getMongoUri() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error('Please define the DATABASE_URL environment variable inside .env.local');
  }
  return uri;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached = (global as any).mongoose;

if (!cached) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    const uri = getMongoUri();
    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      console.log(`Successfully connected to MongoDB (${mongoose.connection.host}/${mongoose.connection.name}).`);
      return mongoose;
    }).catch(error => {
      console.error('Error connecting to MongoDB', error);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
