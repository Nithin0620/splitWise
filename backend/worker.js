import { httpServerHandler } from 'cloudflare:node';

// Tell server.js to skip dotenv, Socket.IO, and the local listen() call.
process.env.CF_WORKER = '1';

const mod = await import('./server.js');
const { server } = mod.default ?? mod;

export default httpServerHandler(server);
