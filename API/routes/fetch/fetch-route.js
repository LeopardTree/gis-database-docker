import { fetch } from '../../controllers/fetch/fetch.js';
export default async function routes(fastify, options) {

    // currently just for one band
    fastify.get('/fetch', async (request, reply) => {
        const layerName = request.query.layername;
        if(!layerName) return 'layername from query needed';
        const collection = await fastify.mongo.db.collection(layerName);
        const collections = await fastify.mongo.db.listCollections().toArray();
        const metadata = await getMetadata(collections, layerName);
        const result = await collection.find().toArray();
        const raster = [];
        for(let i = 0; i < result.length; i++){
            const x = result[i].valueband1;
            raster.push(x);
        }
        fetch(raster, metadata);
        return {
            TotalDocuments: raster.length,
            Geodata: raster[0]
        }

    })
    const getMetadata = async (listOfLayerNames, nameOfMetadata) => {
        for (const currentName of listOfLayerNames) {
            if (currentName.name === 'Metadata') {
                const setMetadata = await fastify.mongo.db.collection(currentName.name);
                const metadataResult = await setMetadata.find().toArray();
                for (const currentData of metadataResult) {
                    if (currentData.name === nameOfMetadata) return currentData
                }
                return null;
            }
        }
    }
}
