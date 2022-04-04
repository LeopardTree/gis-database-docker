import { store } from '../../controllers/store/store.js';
import { fileNameExtract } from '../../utils/name.js';
import * as geodataRoutes from './geodata/geodata-route.js'
export default async function layersRoutes(fastify, options) {

    fastify.get('/layers', async (request, reply) => {
        const collections = await fastify.mongo.db.listCollections().toArray();
        const arrayOfNames = getNameOfLayers(collections);
        if (arrayOfNames.length !== 0) {
            return {
                Collections: {
                    total: arrayOfNames.length,
                    names: arrayOfNames
                }
            }
        }
        return { message: 'Database is empty' }
    })

    fastify.get('/layers/:layerName', async (request, reply) => {
        const collections = await fastify.mongo.db.listCollections().toArray();
        const data = await getMetadata(collections, request.params.layerName);
        if (data !== null && data !== undefined) return data
        return {
            message: "Error, could not find metadata",
            targetLayerName: request.params.layerName

        }
    })

    fastify.post('/layers', async (request, reply) => {
        const fileName = request.query.filename;
        if (fileName === '' || fileName == null) {
            return 'Filename in query needed to proceed. Add key filename and name with extension.'
        }
        let discrete = request.query.discrete;
        if(discrete != null){
            discrete = discrete.toLowerCase();
        }
        if(discrete === '' && discrete !== 'y' && discrete !== 'yes' && discrete !== 'n' && discrete !== 'no'){
            return 'Discrete in query needed to proceed. Add key discrete and value y/yes or n/no if geodata is discrete or not.'
        }
        if(discrete === 'yes' || discrete === 'y'){
            discrete = true;
        }
        else discrete = false;
        const [name, ext] = await fileNameExtract(fileName);
        const collections = await fastify.mongo.db.listCollections().toArray();
        const ifExists = checkIfLayerExists(collections, fileName);
        if (fileName !== '') {
            if (ifExists !== true) {
                let buffer = await request.body;
                let file = { fileName: fileName, buffer: buffer, discrete: discrete };
                let printArray = [];
                const stored = await store(fastify, file);
                console.log(stored)
                if (stored.rasterImportSuccess === true) {
                    if (stored.metaDataImportSuccess === true) {
                        printArray.push('Stored file ' + fileName + ' to database with ' + stored.insertedPixels + ' pixels and metadata.');
                    }
                    else {
                        printArray.push('Stored file ' + fileName + ' to database with ' + stored.insertedPixels + ' pixels but failed storing metadata.');
                    }
                }
                else {
                    printArray.push('Storing of file ' + fileName + ' to database failed.');
                }
                return printArray;
            }
            return { message: 'A layer with this name already exists in database.' }
        }
    })

    fastify.patch('/layers/:layerName/setNewName/:newLayerName', async (request,reply) => {
        const collections = await fastify.mongo.db.listCollections().toArray();
        const ifExists = checkIfLayerExists(collections, request.params.newLayerName);
        const arrayOfNames = getNameOfLayers(collections);
        for (const name of arrayOfNames) {
            if (ifExists === false && name === request.params.layerName) {
                const currentMetadata = await fastify.mongo.db.collection('Metadata').find().toArray();
                for (const metadataName of currentMetadata) {
                    if (metadataName.name === request.params.layerName) {
                        await fastify.mongo.db.renameCollection(request.params.layerName, request.params.newLayerName);
                        await fastify.mongo.db.collection('Metadata').updateOne({ name: request.params.layerName }, {
                            $set: { "name": request.params.newLayerName }
                        })
                        return {
                            message: 'Successful',
                            previousLayerName: request.params.layerName,
                            newLayerName: request.params.newLayerName,
                            newMetadataName: request.params.newLayerName
                        }
                    }
                }
            }
        }
        return {
            message: 'Incorrect input',
            targetLayerName: request.params.layerName,
            newLayerName: request.params.newLayerName
        }
    })

    fastify.delete('/layers/:layerName', async (request, reply) => {
        const collections = await fastify.mongo.db.listCollections().toArray();
        const arrayOfNames = getNameOfLayers(collections);
        for (const name of arrayOfNames) {
            if (name === request.params.layerName) {
                const metadataOfCurrentLayer = await getMetadata(collections, request.params.layerName)
                if (metadataOfCurrentLayer.name === request.params.layerName && metadataOfCurrentLayer.name === name) {
                    const setMetadata = await fastify.mongo.db.collection('Metadata');
                    await setMetadata.deleteOne({name: request.params.layerName});
                    await fastify.mongo.db.collection(request.params.layerName).drop();
                    return {
                        message: 'Deleted layer and metadata',
                        deletedLayer: request.params.layerName
                    }
                }
            }
        }
        return {
            message: 'Does not exist in database',
            targetLayerName: request.params.layerName
        }
    })

    //// functions
    const checkIfLayerExists = (collectionsInDb, layerNameToCheck) => {
        const listOflayerNames = getNameOfLayers(collectionsInDb);
        let collectionExists = false;
        for (const layerName of listOflayerNames) {
            if (layerName === layerNameToCheck) return collectionExists = true;
        }
        return collectionExists = false;
    }

    const getNameOfLayers = (listOfNames) => {
        const currentListOfNames = [];
        for (const collName of listOfNames) {
            if (collName.name !== 'Metadata') {
                currentListOfNames.push(collName.name);
            }
        }
        return currentListOfNames
    }

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
    
    fastify.register(geodataRoutes);
}
