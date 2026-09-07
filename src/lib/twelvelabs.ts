import { TwelveLabs } from 'twelvelabs-js';

const apiKey = process.env.TWELVE_LABS_API_KEY;

export const twelveLabs = new TwelveLabs({ 
  apiKey: apiKey || 'dummy-key-for-build' 
});
