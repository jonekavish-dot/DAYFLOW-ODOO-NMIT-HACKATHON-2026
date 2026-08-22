import { createApp } from '../src/server.js';

let appInstance = null;

export default async function handler(req, res) {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance.handler(req, res);
}
