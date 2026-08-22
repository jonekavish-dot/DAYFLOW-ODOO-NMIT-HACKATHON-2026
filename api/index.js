import { createApp } from '../src/server.js';

let appInstance = null;

export default async function handler(req, res) {
  try {
    if (!appInstance) {
      appInstance = createApp();
    }
    await appInstance.handler(req, res);
  } catch (err) {
    console.error('Serverless invocation error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
}
