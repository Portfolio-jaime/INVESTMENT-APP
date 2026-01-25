async function routes(fastify, options) {
  // Mock data for investments
  const investments = [
    { id: 1, symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, price: 150.00 },
    { id: 2, symbol: 'GOOGL', name: 'Alphabet Inc.', quantity: 5, price: 2800.00 }
  ];

  // GET /api/v1/investments
  fastify.get('/investments', async (request, reply) => {
    return { investments };
  });

  // GET /api/v1/investments/:id
  fastify.get('/investments/:id', async (request, reply) => {
    const { id } = request.params;
    const investment = investments.find(inv => inv.id === parseInt(id));
    if (!investment) {
      return reply.code(404).send({ error: 'Investment not found' });
    }
    return { investment };
  });

  // POST /api/v1/investments
  fastify.post('/investments', async (request, reply) => {
    const { symbol, name, quantity, price } = request.body;
    const newInvestment = {
      id: investments.length + 1,
      symbol,
      name,
      quantity,
      price
    };
    investments.push(newInvestment);
    return { investment: newInvestment };
  });

  // PUT /api/v1/investments/:id
  fastify.put('/investments/:id', async (request, reply) => {
    const { id } = request.params;
    const { symbol, name, quantity, price } = request.body;
    const investment = investments.find(inv => inv.id === parseInt(id));
    if (!investment) {
      return reply.code(404).send({ error: 'Investment not found' });
    }
    investment.symbol = symbol || investment.symbol;
    investment.name = name || investment.name;
    investment.quantity = quantity || investment.quantity;
    investment.price = price || investment.price;
    return { investment };
  });

  // DELETE /api/v1/investments/:id
  fastify.delete('/investments/:id', async (request, reply) => {
    const { id } = request.params;
    const index = investments.findIndex(inv => inv.id === parseInt(id));
    if (index === -1) {
      return reply.code(404).send({ error: 'Investment not found' });
    }
    investments.splice(index, 1);
    return { message: 'Investment deleted' };
  });
}

module.exports = routes;