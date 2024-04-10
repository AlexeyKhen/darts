import express from "express"
import dotenv from 'dotenv';

import mongoose from "mongoose";
import {startParse} from "./ws/parser.js";
import {Game} from "./models/models.js";


const config = dotenv.config().parsed


const app = express()
const PORT = 3000

async function start() {
    try {

        await mongoose.connect(config.DB_ADDRESS)
        app.listen(PORT, () => {
            console.log("started server")
            setInterval(startParse, 10800000);
        })


    } catch (e) {
        console.log(e)
    }
}

app.get('/parse', async (req, res) => {
    try {
        startParse()
        res.json({"message": "started"});
    } catch (error) {
        // Handle errors
        console.error("Error fetching game IDs:", error);
        res.status(500).json({message: "Internal server error"});
    }
});

app.get('/games', async (req, res) => {
    try {
        // Query all game documents
        const games = await Game.find({});

        // Extract IDs from the documents
        const gameIds = games.map(game => game['id']);

        // Return the array of game IDs
        res.json(gameIds);
    } catch (error) {
        // Handle errors
        console.error("Error fetching game IDs:", error);
        res.status(500).json({message: "Internal server error"});
    }
});

start()
