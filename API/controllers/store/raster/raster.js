// modules from https://geotiffjs.github.io/geotiff.js/
import { fromArrayBuffer } from 'geotiff';
import path from 'path';
import {fileNameExtract} from '../../../utils/name.js';
export class Raster{
    //https://stackoverflow.com/questions/43431550/async-await-class-constructor
    constructor(file){
        this.fileName = file.fileName;
        this.boundingBox = '';
        this.layer = '';
        this.pixelSize = '';
        this.name = '';
        this.width = '';
        this.height = '';
        this.dateOfGeoDataCollected = '';
        this.originalFiletype = '';
        this.typedArrayDatatype = '';
        this.spatialReferenceSystem = '';
        this.GDAL_NODATA = '';
        this.discreteGeodata = file.discrete;
        this.metaData = {name: this.name, boundingBox: this.boundingBox, 
        pixelSize: this.pixelSize, dateOfGeoDataCollected: this.dateOfGeoDataCollected,
        resolution: [this.width, this.height], GDAL_NODATA: this.GDAL_NODATA,
        typedArrayDatatype: this.typedArrayDatatype, spatialReferenceSystem: this.spatialReferenceSystem,
        discreteGeodata: this.discreteGeodata};
        this.dBInsertArray = '';
        this.arrayBuffer = file.buffer;
        
    }
    async createRasterObj() {
        const geoTiffFile = await fromArrayBuffer(this.arrayBuffer);
        const geoImage = await geoTiffFile.getImage();
        // ModelPixelScaleTag = (ScaleX, ScaleY, ScaleZ)
        this.pixelSize = await geoImage.getFileDirectory().ModelPixelScale;
        this.boundingBox = await this.createGeoBBox(geoImage);
        this.layer = await geoImage.readRasters();  
        this.typedArrayDatatype = await this.checkTypedArrayType(this.layer[0]);
        this.GDAL_NODATA = await this.retrieveGDAL_NODATA(geoImage);
        [this.name, this.originalFiletype] = await fileNameExtract(this.fileName);
        this.spatialReferenceSystem = await this.sRS(geoImage);
        this.width = this.layer.width;
        this.height = this.layer.height;
        this.metaData = {name: this.name, boundingBox: this.boundingBox, 
        pixelSize: this.pixelSize, dateOfGeoDataCollected: this.dateOfGeoDataCollected,
        resolution: [this.width, this.height], GDAL_NODATA: this.GDAL_NODATA, 
        spatialReferenceSystem: this.spatialReferenceSystem, typedArrayDatatype: this.typedArrayDatatype,
        discreteGeodata: this.discreteGeodata};
        this.coordinateArray = '';
    }
    async loadFile(filePath) {
        try{
            const geoTiffFile = await fromFile(filePath);
            return geoTiffFile;
        }
        catch(err){
            console.log(err);
        }
    }
    //https://stackoverflow.com/questions/58280379/how-to-find-the-type-of-a-typedarray
    async checkTypedArrayType(someTypedArray) {
        return someTypedArray &&
            someTypedArray.constructor &&
            someTypedArray.constructor.name ||
            null;
    }
    async sRS(geoImage){
        const geoKeys = await geoImage.getGeoKeys();
        const srs = await geoKeys.ProjectedCSTypeGeoKey;
        
        if(!srs){
            const GTCitationGeoKey = await geoKeys.GTCitationGeoKey;
            const GeogCitationGeoKey = await geoKeys.GeogCitationGeoKey;
            if(GTCitationGeoKey === 'SWEREF99 TM' || GeogCitationGeoKey === 'SWEREF99'){
                return 3006;
            }
            throw new Error('reference system not supported yet');
        }
        return srs;
    }
    async retrieveGDAL_NODATA(geoImage) {
        let GDAL_NODATA;
        try {
            GDAL_NODATA = await geoImage.fileDirectory.GDAL_NODATA;
        }
        catch (err) {
            console.log(err);
        }
        if (GDAL_NODATA) {
            try {
                return parseInt(GDAL_NODATA);
            }
            catch (err) {
                console.log(err);
            }
            try {
                return number(GDAL_NODATA);
            }
            catch (err) {
                console.log(err);
            }
        }
        return GDAL_NODATA;
    }
    async createGeoBBox(geoImage) {
        const bBox = await geoImage.getBoundingBox();
        // move bounding box up left half a pixel if pixels is represented as points 
        const GTRasterTypeGeoKey = await geoImage.geoKeys.GTRasterTypeGeoKey;
        if(GTRasterTypeGeoKey === 2){
            bBox[0] -= this.pixelSize[0]/2;
            bBox[1] += this.pixelSize[1]/2;
            bBox[2] -= this.pixelSize[0]/2;
            bBox[3] += this.pixelSize[1]/2;
          }
        return bBox;
    }
    async getMetaData() {
        return this.metaData;
    }
    // Create array with objects for each pixel.
    // Each pixel-object containing value and x-coordinate, y-coordinate for each pixels center point.
    async extractRaster(){
        let layer = this.layer;
        const xmin = this.boundingBox[0];
        const ymax = this.boundingBox[3];
        // move in start of xcoord and ycoord to middle of first box 
        let xcoord = xmin + this.pixelSize[0]/2;
        let ycoord = ymax - this.pixelSize[1]/2;
        const valueKeyVariable = []
        for (let index = 1; index <= layer.length; index++) {
            valueKeyVariable.push("valueband" + index);
        }
        const dBInsertArray = [];
        let k = 0
        for (let row = 0; row < this.height; row++) {
            for (let column = 0; column < this.width; column++) {
                let pixelDoc = {xcoord: xcoord, ycoord: ycoord};
                // insert key and value for each band
                for (let index = 0; index < layer.length; index++) {
                    pixelDoc[valueKeyVariable[index]] = layer[index][k];
                }
                dBInsertArray.push(pixelDoc);
                xcoord += this.pixelSize[0];
                k++;
            }
            ycoord -= this.pixelSize[1];
            xcoord = xmin;
        }
        return dBInsertArray;
    }
    //store pixelcoordinates as a bbox for each pixel
    async extractRaster2(){
        let layer = this.layer;
        const originX = this.boundingBox[0];
        const originY = this.boundingBox[3];
        // create start pixel boundingbox values
        let xmin = originX;
        let ymax = originY;
        let ymin = ymax - this.pixelSize[1];
        let xmax = xmin + this.pixelSize[0];
        const valueKeyVariable = []
        for (let index = 1; index <= layer.length; index++) {
            valueKeyVariable.push("valueband" + index);
        }
        const dBInsertArray = [];
        let k = 0
        for (let row = 0; row < this.height; row++) {
            for (let column = 0; column < this.width; column++) {
                let pixelDoc = {pixelBoundingBox: [xmin, ymin, xmax, ymax]};
                // insert key and value for each band
                for (let index = 0; index < layer.length; index++) {
                    pixelDoc[valueKeyVariable[index]] = layer[index][k];
                }
                dBInsertArray.push(pixelDoc);
                xmin = xmax;
                xmax += this.pixelSize[0];
                k++;
            }
            ymax = ymin;
            ymin -= this.pixelSize[1];
            xmin = originX;
        }
        console.log(dBInsertArray[0]);
        return dBInsertArray;
    }

}