import { createApp } from '../src/server.js';

let appPromise = null;

export default async function handler(req, res) {
  try {
    if (!appPromise) {
      appPromise = createApp();
    }
    const app = await appPromise;
    await app.handler(req, res);
  } catch (err) {
    console.error('Vercel Serverless Invocation Error:', err?.message || err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    }
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
}
