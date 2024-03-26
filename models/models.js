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
    playerId: {
        type: Schema.Types.Number,
        ref: 'Player',
        required: true
    },
    outcomes: [{
        sector: {
            type: Number,
            required: true
        },
        color: {
            type: String,
            enum: ['white', 'black', "green"],
            required: true
        },
        order: {
            type: String,
            required: true
        }
    }]
});

export const Player = model('Player', playerSchema);
export const Game = model('Game', gameSchema);
