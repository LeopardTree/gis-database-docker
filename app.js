'use strict';
import {start} from './server.js'
export const config = {connectionURL: 'mongodb://mongo:27017', dbName: 'medelpunkt'};
//console.time('Duration to execute everything');


// https://www.loc.gov/preservation/digital/formats/content/tiff_tags.shtml

const main = async () =>{

    await start(config);


    // // https://stackoverflow.com/questions/8373905/when-to-close-mongodb-database-connection-in-nodejs
    // await gisDb.close(); // Close MongodDB Connection when Process ends
}
const resulthandler = err => {
    //console.timeEnd('Duration to execute everything');
    if(err)throw err;
    console.log("Done");
}
main().then(resulthandler).catch(resulthandler);