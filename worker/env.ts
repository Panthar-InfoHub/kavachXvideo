// Must be the FIRST import in the worker entrypoint.
// Imports are hoisted above statements, so calling dotenv.config() inside
// worker/index.ts ran *after* '../src/lib/db' had already read process.env.
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
