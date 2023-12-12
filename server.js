// Imports
const DatabaseService = require('./database/database.js');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const PinsRouter = require('./routes/pins.js');
const AuthRouter = require('./routes/auth.js');

async function setupServer() {
    // Express Setup
    const PORT = 8000;
    const app = express();
    app.use(bodyParser());
    
    // Setting the view engine to render ejs templates
    app.set('view engine', 'ejs');

    const database = new DatabaseService.Database();
    await database.setup();

    app.use('/', AuthRouter(database));
    app.use('/', PinsRouter(database));

    app.listen(PORT, () => {
        console.log(`Server Started on port ${PORT}`);
    });

    app.use(express.static(path.join(__dirname, 'public')));

    process.on('SIGTERM', () => {
        app.close(() => {
            // If the app is shutdown we close the database connection
            database.client.close();
        });
    });
}

setupServer();