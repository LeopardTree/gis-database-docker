import gdal from 'gdal';

// currently just for one band
export const fetch = async (raster, metadata) => {
    let arrtype = metadata.typedArrayDatatype;
    let fileType = 'raster';
    let drivertype;
    if (fileType === 'raster') {
        drivertype = 'GTiff';
    }
    const imageWidth = metadata.resolution[0];
    const imageHeight = metadata.resolution[1];
    let bandCount = 1;
    let datatype;
    switch (arrtype) {
        case 'Int8Array':
            raster = Int8Array.from(raster);
            datatype = gdal.GDT_Byte;
            break;
        case 'Uint8Array':
            raster = Uint8Array.from(raster);
            datatype = gdal.GDT_Byte;
            break;
        case 'Uint8ClampedArray':
            raster = Uint8ClampedArray.from(raster);
            datatype = gdal.GDT_Byte;
            break;
        case 'Int16Array':
            raster = Int16Array.from(raster);
            datatype = gdal.GDT_Int16;
            break;
        case 'Uint16Array':
            raster = Uint16Array.from(raster);
            datatype = gdal.GDT_UInt16;
        case 'Int32Array':
            raster = Int32Array.from(raster);
            datatype = gdal.GDT_Int32;
            break;
        case 'Uint32Array':
            raster = Uint32Array.from(raster);
            datatype = gdal.GDT_UInt32;
        case 'Float32Array':
            raster = Float32Array.from(raster);
            datatype = gdal.GDT_Float32;
            break;
        case 'Float64Array':
            raster = Float64Array.from(raster);
            datatype = gdal.GDT_Float64;
            break;
        default:
            console.log('writing with default datatype');
            raster = Uint16Array.from(raster);
            datatype = gdal.GDT_UInt16;
    }

    // create geotiff driver
    const driver = gdal.drivers.get(drivertype);
    //create destination dataset. create(destination_name, imageWidth, imageHeight, numBands, gdal_typedArray)
    const destination_name = 'fetched/'+ metadata.name + 'copy.tif';
    let dst_ds = driver.create(destination_name, imageWidth, imageHeight, bandCount, datatype);

    //add data
    const band1 = dst_ds.bands.get(1);
    band1.pixels.write(0, 0, imageWidth, imageHeight, raster);
    if(metadata.GDAL_NODATA !== null){
        band1.noDataValue = metadata.GDAL_NODATA;
    }
    
    //create coordinatesystem object with spatial reference
    const epsg = metadata.spatialReferenceSystem;
    if (epsg === null) {
        // if no projection geokey. set to sweref TM
        epsg = 3006;
    }
    const crs = new gdal.SpatialReference.fromEPSG(epsg);

    // calculate transformation 
    const bbox = metadata.boundingBox;
    let xmin = bbox[0];
    let ymax = bbox[3];

    // transformation array. 0 means north is up in relation to the axle
    // trf = [xmin, pixelwidth_vector, Xnorth_scalar, ymax, Ynorth_scalar, pixelheight_vector]
    const trf = [xmin, metadata.pixelSize[0], 0, ymax, 0, -metadata.pixelSize[1]];

    //set spatial reference and geotransform
    dst_ds.srs = crs;
    dst_ds.geoTransform = trf;

    // write to file
    dst_ds.flush();

    //close dataset
    dst_ds.close();

}