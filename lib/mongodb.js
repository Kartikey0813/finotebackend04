// lib/mongodb.js
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env or in your hosting provider.');
}

/**
 * Global cached connection across module reloads (works in serverless & dev).
 * In Vercel / serverless, modules can be reloaded frequently — reusing the
 * existing connection avoids creating many connections to Atlas.
 */
let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    // console.log('Using cached mongoose connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      // Mongoose 7 defaults are OK; keep explicit options if you want
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      bufferCommands: false,  // don't buffer commands if not connected
      autoIndex: process.env.NODE_ENV !== 'production' // avoid building indexes in production on cold-starts
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then(m => m.connection);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = dbConnect;
