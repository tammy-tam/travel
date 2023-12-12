const express = require('express');
const crypto = require('crypto');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const DatabaseService = require('../database/database.js');

function AuthRouter(database) {
    var router = express.Router();

    // Session Middleware Setup
    router.use(
        session({
            secret: 'your-secret-key',
            resave: false,
            saveUninitialized: false
        })
    );

    // Passport Authentication Setup
    router.use(passport.initialize());
    router.use(passport.session());

    // User Data Middleware
    router.use((req, res, next) => {
        if (req.user) {
            res.locals.user = req.user;
        }
        next();
    });

    // Local Strategy Setup
    passport.use(
        new LocalStrategy(
            async function verify(username, password, callback) {
                let foundUser = await database.collections.users.findOne({ username: username }).catch((error) => {
                    if (error) {
                        callback("Incorrect username or password", null);
                    }
                });
                if (!foundUser) {
                    callback("Incorrect username or password", null);
                    return;
                }
                crypto.pbkdf2(password, foundUser.salt, 310000, 32, 'sha256', function (_, hashedPassword) {
                    if (foundUser.password !== hashedPassword.toString('hex')) {
                        callback("Incorrect username or password");
                        return;
                    }
                    return callback(null, foundUser);
                });
            }
        )
    );

    // Serialize and Deserialize User Setup
    passport.serializeUser(function (user, callback) {
        return callback(null, { id: user.id, username: user.username });
    });

    passport.deserializeUser(function (user, callback) {
        return callback(null, user);
    });

    // Registration Route
    router.get('/register', (req, res) => {
        res.render('auth/register', { errorMessage: null });
    });

    router.post('/register', async (req, res) => {
        let data = req.body;
        console.log(data);
        const salt = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await new Promise((resolve, _) => {
            crypto.pbkdf2(data.password, salt, 310000, 32, 'sha256', (_, hashedPassword) => {
                resolve(hashedPassword);
            });
        });

        console.log(hashedPassword.toString('hex'));

        let user = await database.collections.users.insertOne({
            ...data,
            password: hashedPassword.toString('hex'),
            salt: salt
        });

        await new Promise((resolve, _) => {
            req.login({
                id: user.insertedId.toString(),
                username: data.username
            }, () => {
                resolve();
            });
        });

        res.redirect('/');
    });

    // Login Route
    router.get('/login', (req, res) => {
        res.render('auth/login', { errorMessage: null });
    });

    router.post('/login', (req, res, next) => {
        passport.authenticate('local', async (error, user) => {
            await new Promise((resolve, _) => {
                req.login({
                    id: user._id.toString(),
                    username: user.username
                }, () => {
                    resolve();
                });
            });
            res.redirect('/');
        })(req, res, next);
    });

    // Logout Route
    router.get('/logout', (req, res, next) => {
        req.logout(function (error) {
            if (error) {
                next(error);
                return;
            }
            res.redirect('/');
        });
    });

    return router;
}

module.exports = AuthRouter;
