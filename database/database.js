const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;

// The `this` keyword is used when accessing local variables or functions when inside a class.
class Database {
    collections = {
        'pins': null,
        'users': null
    };
    
    client = null;
    database = null;
    initialized = false;

    // This database setup logic is extracted out of the main server file
    // This function will make a connection to the database server, get the database, and create/fetch the collections we listed inside the collections variable above
    async setup() {
        this.client = await new mongodb.MongoClient('mongodb+srv://meiyit2012:user123@cluster0.isf8xz2.mongodb.net/?retryWrites=true&w=majority').connect();
        this.database = await this.client.db('database');
        let listedCollections = await this.database.listCollections({}, { nameOnly: true }).toArray();
        let names = listedCollections.map((collection) => {
            return collection.name;
        });

        Object.keys(this.collections).forEach(async (key) => {
            if (names.includes(key)) {
                this.collections[key] = await this.database.collection(key);
                console.log(`Collection - ${key} was fetched`);
            } else {
                this.collections[key] = await this.database.createCollection(key);
                console.log(`Collection - ${key} was created`);
            }
        });
        this.initialized = true;
        console.log("Database initialized.");
    }
}

module.exports = { Database, ObjectId };