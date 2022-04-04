import { store_geotiff } from './raster/store_geotiff.js';

export const store = async (fastify, file) => {


    const filextension = 'tif'
    if (filextension === 'tif') {
        file.buffer = toArrayBuffer(file.buffer);
        const stored = await store_geotiff(fastify, file);
        return stored;
    }
    else{
        return "Can't process that filetype";
    }
    
}

//https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
function toArrayBuffer(buffer) {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return arrayBuffer;
}