async function routes(fastify, options) {
  // Mock data for recommendations
  const recommendations = [
    { id: 1, symbol: 'TSLA', name: 'Tesla Inc.', reason: 'High growth potential', risk: 'High' },
    { id: 2, symbol: 'MSFT', name: 'Microsoft Corp.', reason: 'Stable returns', risk: 'Low' }
  ];

  // GET /api/v1/recommendations
  fastify.get('/recommendations', async (request, reply) => {
    return { recommendations };
  });

  // GET /api/v1/recommendations/:id
  fastify.get('/recommendations/:id', async (request, reply) => {
    const { id } = request.params;
    const recommendation = recommendations.find(rec => rec.id === parseInt(id));
    if (!recommendation) {
      return reply.code(404).send({ error: 'Recommendation not found' });
    }
    return { recommendation };
  });

  // POST /api/v1/recommendations
  fastify.post('/recommendations', async (request, reply) => {
    const { symbol, name, reason, risk } = request.body;
    const newRecommendation = {
      id: recommendations.length + 1,
      symbol,
      name,
      reason,
      risk
    };
    recommendations.push(newRecommendation);
    return { recommendation: newRecommendation };
  });

  // PUT /api/v1/recommendations/:id
  fastify.put('/recommendations/:id', async (request, reply) => {
    const { id } = request.params;
    const { symbol, name, reason, risk } = request.body;
    const recommendation = recommendations.find(rec => rec.id === parseInt(id));
    if (!recommendation) {
      return reply.code(404).send({ error: 'Recommendation not found' });
    }
    recommendation.symbol = symbol || recommendation.symbol;
    recommendation.name = name || recommendation.name;
    recommendation.reason = reason || recommendation.reason;
    recommendation.risk = risk || recommendation.risk;
    return { recommendation };
  });

  // DELETE /api/v1/recommendations/:id
  fastify.delete('/recommendations/:id', async (request, reply) => {
    const { id } = request.params;
    const index = recommendations.findIndex(rec => rec.id === parseInt(id));
    if (index === -1) {
      return reply.code(404).send({ error: 'Recommendation not found' });
    }
    recommendations.splice(index, 1);
    return { message: 'Recommendation deleted' };
  });
}

module.exports = routes;