import express from "express"
import dotenv from 'dotenv';

import mongoose from "mongoose";
import {collect} from "./ws/collector.js";
import {Game, Player} from "./models/models.js";

const config = dotenv.config().parsed


const app = express()
const PORT = 3000

async function start() {
    try {
        await mongoose.connect(config.DB_ADDRESS)
        app.listen(PORT, () => {
            console.log('server started')
           collect()
        })


    } catch (e) {
        console.log(e)
    }
}

app.get('/games/count', async (req, res) => {
    try {
        const gameCount = await Game.countDocuments();
        const games = await Game.find(); // Retrieve all games
        let totalRounds = 0;
        games.forEach(game => {
            totalRounds += game.outcomes.length; // Add rounds from each game
        });
        res.json({ gameCount, totalRounds });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to get all players
app.get('/players/:name', async (req, res) => {
    const playerName = req.params.name;
    try {
        const player = await Player.findOne({ firstName: playerName });
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }
        const games = await Game.find({ playerId: player.id });

        res.json({ games });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

start()
