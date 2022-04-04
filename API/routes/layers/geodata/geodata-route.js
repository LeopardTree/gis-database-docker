export default async function geodataRoutes(fastify, options) {

  fastify.get('/layers/:layerName/geodata', async (request, reply) => {
    const collections = await fastify.mongo.db.listCollections().toArray();
    let collectionExists = false;
    collections.forEach(collection => {
      if (request.params.layerName === collection.name) {
        collectionExists = true;
        return;
      }
    })
    if (collectionExists === true) {
      const setCollection = await fastify.mongo.db.collection(request.params.layerName);
      const result = await setCollection.find().toArray();
      return {
        TotalDocuments: result.length,
        Geodata: result
      }
    }
    if (collectionExists === false) return 'A layer with this name does not exist in database.'
  })

  fastify.get('/layers/:layerName/geodata/valueband/:bandValue', async (request, reply) => {
    const setCollection = await fastify.mongo.db.collection(request.params.layerName);
    const result = await setCollection.find({ valueband1: parseFloat(request.params.bandValue) }).toArray();
    const amount = result.length
    if (!result) return 'invalid value.'
    return {
      TotalFound: amount,
      Geodata: result
    }
  })

  fastify.get('/layers/:layerName/geodata/:id', async (request, reply) => {
    const setCollection = await fastify.mongo.db.collection(request.params.layerName);
    const id = fastify.mongo.ObjectId;
    const result = await setCollection.find({ _id: id(request.params.id) }).toArray();
    if (!result || result.length === 0) return 'Document with this id does not exist.'
    return result
  })

  fastify.delete('/layers/:layerName/geodata/:objId', async (request, reply) => {
    const setCollection = await fastify.mongo.db.collection(request.params.layerName);
    const objId = fastify.mongo.ObjectId;
    const result = await setCollection.findOneAndDelete({ _id: objId(request.params.objId) });
    if (result.value !== null) return result
    return { message: 'Object id does not exist.' }
  })
}
