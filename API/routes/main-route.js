export default async function routes (fastify, options) {
     fastify.get('/', async (request, reply) => {
      return 'Foran Gis-Database'
  
    })
  }