import express from "express"
import dotenv from 'dotenv';

import mongoose from "mongoose";
import {collect} from "./ws/collector.js";

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

start()
