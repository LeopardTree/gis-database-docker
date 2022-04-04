
export const valueband = async (request, reply) => {
  console.log(request.url);
  const querycollName = request.params.name;
  const queryValBand = parseInt(request.params.bandValue);
  console.log(queryValBand);
  console.log(querycollName);

  const setCollection = await fastify.mongo.db.collection(querycollName);
  const result = await setCollection.find({ valueband1: queryValBand }).toArray();
  const amount = result.length
  if (!result) {
    throw new Error('invalid value')
  }
  return {
    TotalFound: amount,
    Geodata: result
  }
};
