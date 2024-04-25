import {Schema, model} from "mongoose";

const playerSchema = new Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: false,
        unique: false
    },
    secondName: {
        type: String,
        required: false,
        unique: false
    },
    nickName: {
        type: String,
        required: false,
        unique: false
    }
});

const outcomeSchema = new Schema({
    sector: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        enum: ['white', 'black', 'green'],
        required: true
    },
    order: {
        type: Number,
        required: true
    }
}, { _id: false });

const gameSchema = new Schema({
    id: {
        type: Number,
        required: true,
        unique: false
    },
    startDate: {
        type: Date,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    playerId: {
        type: Number,
        ref: 'Player',
        required: true
    },
    outcomes: [outcomeSchema]
});

export const Player = model('Player', playerSchema);
export const Game = model('Game', gameSchema);
