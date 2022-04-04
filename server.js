'use strict';
import Fastify from "fastify";
const fastify = Fastify({
  logger: true
})

import * as mainRoute from './API/routes/main-route.js';
import * as layersRoute from './API/routes/layers/layers-route.js';
import * as fetchRoute from './API/routes/fetch/fetch-route.js';
import dbConnector from './API/database/dbConnector.js';
//import * as geodataRoute from './API/routes/layers/geodata/geodata-route.js';
// Start the server
export const start = async () => {
  fastify.register(dbConnector);
  fastify.register(mainRoute);
  fastify.register(layersRoute);
  fastify.register(fetchRoute);

  fastify.addContentTypeParser('image/tiff', { parseAs: 'buffer' }, async (request, payload, done) => {
    try {
      return payload;
    } catch (err) {
      err.statusCode = 400;
      return err;
    }
  });
  
  try {
    await fastify.listen(3000, '0.0.0.0');
  }
  catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};


