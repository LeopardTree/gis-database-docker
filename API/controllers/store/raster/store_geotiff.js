import { Raster } from './raster.js';

//import {Database} from './API/database/mongodbClient.js'
export const store_geotiff = async (fastify, file) =>{

    const tifFile = new Raster(file);
    await tifFile.createRasterObj();
    console.time('Duration to extract to coordinates');
    tifFile.dBInsertArray = await tifFile.extractRaster();
    
    console.timeEnd('Duration to extract to coordinates');
    console.time('Duration to insert '+ file.fileName + ' to MongoDB');
    
    const stored = await insertRasterToDatabase(tifFile, fastify);
    console.timeEnd('Duration to insert '+ file.fileName + ' to MongoDB');
    return stored;
}
const insertRasterToDatabase = async (rasterObject, fastify) => {
    let stored = {rasterImportSuccess: '', insertedPixels: '', metaDataImportSuccess: ''};
    const rasterImport = await fastify.mongo.db.collection(rasterObject.name).insertMany(rasterObject.dBInsertArray);
    stored.rasterImportSuccess = rasterImport.acknowledged;
    stored.insertedPixels = rasterImport.insertedCount;
    if(stored.rasterImportSuccess === true){
        const metadataImport = await fastify.mongo.db.collection('Metadata').insertOne(rasterObject.metaData);
        stored.metaDataImportSuccess = metadataImport.acknowledged;
    }
    else{
        stored.metaDataImportSuccess = false;
    }
    
    return stored;
}
