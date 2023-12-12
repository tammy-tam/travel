const DatabaseService = require('../database/database.js');
const express = require('express');
const helpers = require('../helpers/auth.js');

function PinsRouter(database) {
    var router = express.Router();

    // Rendering the main view where all the pins are shown
    router.get('/', async (req, res) => {
        // Fetch all the pins from the database
        let pins = await database.collections.pins.find({}).toArray();
        res.render('index', {pins: pins});
    });

    // Rendering the New pin View
    router.get('/pin', helpers.isAuthenticated, (req, res) => {
        res.render('pins/new.ejs', {error: null});
    });

    // Rendering the existing pin view
    router.get('/pin/:id', async (req, res) => {
        // Fetch the single pin that matches the ID passed into the params
        let pin = await database.collections.pins.findOne(new DatabaseService.ObjectId(req.params.id));
        res.render('pins/existing.ejs', {pin: pin});
    });

    // Create a new pin
    router.post('/pin', helpers.isAuthenticated, async (req, res) => {
        let data = req.body;
        // If the data passed in doesnt match whats expected then we render the new pin view again but this time with an error to display
        if (Object.keys(data).length <= 0 || (!data.title || !data.description || !data.image)) {
            res.render('pins/new.ejs', {error: "There was an issue creating the Pin."});
            return;
        }

        // Create a new pin
        let pin = await database.collections.pins.insertOne(data);

        // Once pin is created we can redirect to the existing pin view
        res.redirect(301, `/pin/${pin.insertedId.toString()}`);
    });

    // Rendering the update pin view
    router.get('/updatePin/:id', helpers.isAuthenticated, async (req, res) => {
        // Fetch the single pin that matches the ID passed into the params
        let pin = await database.collections.pins.findOne(new DatabaseService.ObjectId(req.params.id));
        res.render('pins/update.ejs', {error:null, pin: pin});
    });

    // Update an existing pin
    router.post('/updatePin/:id', helpers.isAuthenticated, async (req, res) => {
        // Get the update form's data
        let data = req.body;
        console.log(data);
        console.log(req.params.id);

        let pinID = new DatabaseService.ObjectId(req.params.id);

        // If the data passed in doesnt match whats expected then we render the update pin view again but this time with an error to display
        if (Object.keys(data).length <= 0 || (!data.title || !data.description || !data.image)) {
            res.render('pins/update.ejs', {error: "There was an issue updating the Pin."});
            return;
        }

        // Update an existing pin
        let updatedPin = await database.collections.pins.updateOne({_id: pinID}, {$set: {title: data.title, image: data.image, description: data.description}});

        // Once pin is updated we can redirect to the updated pin view
        res.redirect(301, `/pin/${req.params.id}`);
    });
    
    // Delete an existing pin
    router.get('/deletePin/:id', helpers.isAuthenticated, async (req, res) => {

        let pinID = new DatabaseService.ObjectId(req.params.id);

        // Delete an existing pin
        await database.collections.pins.deleteOne({_id: pinID});

        // Once the pin is deleted we can redirect to the main view where all the pins are shown
        res.redirect(301, '/');
    });


    return router;
}

module.exports = PinsRouter;