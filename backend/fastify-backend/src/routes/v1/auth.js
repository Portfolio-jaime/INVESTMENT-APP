async function routes(fastify, options) {
  // Mock users data
  const users = [
    { id: 1, username: 'user1', password: 'password1', email: 'user1@example.com' }
  ];

  // POST /api/v1/auth/login
  fastify.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    const token = fastify.jwt.sign({ id: user.id, username: user.username });
    return { token, user: { id: user.id, username: user.username, email: user.email } };
  });

  // POST /api/v1/auth/register
  fastify.post('/auth/register', async (request, reply) => {
    const { username, password, email } = request.body;
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return reply.code(409).send({ error: 'User already exists' });
    }
    const newUser = {
      id: users.length + 1,
      username,
      password, // In production, hash the password
      email
    };
    users.push(newUser);
    const token = fastify.jwt.sign({ id: newUser.id, username: newUser.username });
    return { token, user: { id: newUser.id, username: newUser.username, email: newUser.email } };
  });

  // GET /api/v1/auth/me (protected route)
  fastify.get('/auth/me', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const user = users.find(u => u.id === request.user.id);
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    return { user: { id: user.id, username: user.username, email: user.email } };
  });
}

module.exports = routes;