const fastify = require('fastify')({ logger: true });

// Register plugins
fastify.register(require('@fastify/cors'), {
  origin: true
});

fastify.register(require('@fastify/jwt'), {
  secret: 'supersecret' // In production, use environment variable
});

// JWT authentication hook
fastify.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Register routes
fastify.register(require('./routes/v1/investments'), { prefix: '/api/v1' });
fastify.register(require('./routes/v1/recommendations'), { prefix: '/api/v1' });
fastify.register(require('./routes/v1/auth'), { prefix: '/api/v1' });

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();