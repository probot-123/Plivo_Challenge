const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
// Import directly from the root directory socketServer.js
const { initSocketServer } = require('./socketServer');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('Next.js app prepared');
  
  const server = createServer((req, res) => {
    try {
      // Parse the URL with true to get the query as an object
      const parsedUrl = parse(req.url, true);
      
      // Enhanced logging for CSS file requests
      if (parsedUrl.pathname.includes('.css')) {
        console.log(`CSS Request: ${req.method} ${parsedUrl.pathname}`);
      } else if (parsedUrl.pathname.startsWith('/_next/static')) {
        console.log(`Static Asset Request: ${req.method} ${parsedUrl.pathname}`);
      } else {
        console.log(`Request received: ${req.method} ${parsedUrl.pathname}`);
      }
      
      // Let Next.js handle the request
      handle(req, res, parsedUrl);
    } catch (error) {
      console.error('Error handling request:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Initialize Socket.io
  let socketServer;
  try {
    socketServer = initSocketServer(server);
    console.log('Socket.io server initialized successfully');
  } catch (error) {
    console.error('Error initializing Socket.io server:', error);
  }

  // Global error handler
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    // Keep the server running despite uncaught exceptions
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    // Keep the server running despite unhandled promise rejections
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) {
      console.error('Error starting server:', err);
      throw err;
    }
    console.log(`> Ready on http://localhost:${PORT}`);
  });
})
.catch((error) => {
  console.error('Error preparing Next.js app:', error);
  process.exit(1);
}); 
