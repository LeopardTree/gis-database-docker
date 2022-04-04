import mongodb from 'mongodb';
import fastifyPlugin from 'fastify-plugin'
import fastifyMongo from 'fastify-mongodb'
const MongoClient = mongodb.MongoClient;
//https://stackoverflow.com/questions/52558619/mongodb-in-nodejs-class-structure
//https://github.com/sp-suresh/nodemongoclient
export class Database {
    constructor() {
        this.db = '';
        this.client = '';
    }
    async mongoDbConnect(connectionURL) {
        //resolve och reject är funktioner
        return new Promise((resolve, reject) => {
            //callback funktion
            const callbackFunction = (err, client) => {
                if (err) return reject(err)
                resolve(client)
            };
            MongoClient.connect(connectionURL, callbackFunction);
        })
    }
    async connect(connectionURL, dbName) {
        const client = await this.mongoDbConnect(connectionURL);
        this.db = client.db(dbName);
        this.client = client;
    }
    
    async insertRasterToDatabase(rasterObject, array, db) {
        await db.collection(rasterObject.name).insertMany(array);
        await db.collection(metadata).insertOne(rasterObject.metaData);
    }
    async close() {
        return await this.client.close();
    }
}
async function dbConnector (fastify, options) {
    fastify.register(fastifyMongo, {
      url: 'mongodb://localhost:27017/test_database'
    })
  }
  
export default fastifyPlugin(dbConnector)