import axios from "axios";
import {Game, Player} from "../models/models.js";

let prevData = ""

const colors = {
    20: "black",
    1: "white",
    18: "black",
    4: "white",
    13: "black",
    6: "white",
    10: "black",
    15: "white",
    2: "black",
    17: "white",
    3: "black",
    19: "white",
    7: "black",
    16: "white",
    8: "black",
    11: "white",
    14: "black",
    9: "white",
    12: "black",
    5: "white",
}


async function createPlayerIfNotExists({id, first_name, last_name, nickname}) {
    try {
        let player = await Player.findOne({id});
        if (!player) {
            player = new Player({
                id,
                firstName: first_name.trim(),
                secondName: last_name.trim(),
                nickname: nickname.trim()
            });
            await player.save();
        }
        return player
    } catch (error) {
        console.error('Error creating player:', error);
        throw error;
    }
}


async function createGameIfNotExists({id, startDate, playerId, score}) {
    try {
        let game = await Game.findOne({id, playerId});
        if (!game) {
            game = new Game({id, startDate, playerId, score});
            await game.save();
        }
        return game
    } catch (error) {
        console.error('Error creating player:', error);
        throw error;
    }
}


const getLastContestId = async () => {
    const url = "https://darts-api.rupr.upsl-tech.ru/twirp/duels.darts.api.Api/GetGame"
    const result = await axios.post(url, {})
    const data = result.data
    const contest = data.contest
    return contest.id - 1
}

const findGameWithLargestId = async () => {
    try {
        const game = await Game.findOne().sort({id: -1}).limit(1)
        return game?.["id"] ?? 0
    } catch (error) {
        console.error('Error finding game with the largest ID:', error);
        // Handle error
    }
}


export const fetchContest = async (contestId) => {
    const playerUrs = "https://darts-api.rupr.upsl-tech.ru/twirp/duels.darts.api.Api/GetContest"
    try {

        const result = await axios.post(playerUrs, {id: contestId})
        const data = result.data
        const contest = data.contest
        const startDate = contest.started_at
        const rounds = contest.rounds

        const id = contest.id

        const player1 = await createPlayerIfNotExists(contest.first_player)
        const player2 = await createPlayerIfNotExists(contest.second_player)
        const game1 = await createGameIfNotExists({id, startDate, playerId: player1.id, score: contest["first_player_score"]})
        const game2 = await createGameIfNotExists({id, startDate, playerId: player2.id, score: contest["second_player_score"]})

        const firstPlayerOutcomesAll = []
        const secondPlayerOutcomesAll = []

        rounds.forEach((round) => {
            const firstPlayerOutcomes = round.first_player_outcomes
            const secondPlayerOutcomes = round.second_player_outcomes
            firstPlayerOutcomes?.forEach((outcome) => {
                firstPlayerOutcomesAll.push({
                    sector: outcome.sector ?? 100,
                    color: colors[outcome.sector] ?? "green"
                })
            })
            secondPlayerOutcomes?.forEach((outcome) => {
                secondPlayerOutcomesAll.push({
                    sector: outcome.sector ?? 100,
                    color: colors[outcome.sector] ?? "green"
                })
            })
        })
        game1.outcomes = firstPlayerOutcomesAll
        game2.outcomes = secondPlayerOutcomesAll

        await game1.save()
        await game2.save()


    } catch (e) {
        console.log(`Не получилось спарсить ${contestId}`, e.code)
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let busy = false
export const startParse = async () => {
    console.log('start parse is busy',busy)
    if(busy) return
    busy = true
    const latestId = await getLastContestId()
    const smallestId = await findGameWithLargestId()

    if(latestId === smallestId){
        console.log('нечего парсить')
    }

    for (let i = smallestId + 1; i <= latestId; i++) {
        console.log(`Спарсил игру ${i} из ${latestId}`);
        await fetchContest(i)
        await sleep(1000)
    }
    busy = false
}
