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


async function createGameIfNotExists({id, startDate, playerId}) {
    try {
        let game = await Game.findOne({id, playerId});
        if (!game) {
            game = new Game({id, startDate, playerId});
            await game.save();
        }
        return game
    } catch (error) {
        console.error('Error creating player:', error);
        throw error;
    }
}


function formatDateTime(date) {

    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();
    let day = date.getDate();
    let month = date.getMonth() + 1; // January is 0

    if (hour < 10) {
        hour = '0' + hour;
    }
    if (minute < 10) {
        minute = '0' + minute;
    }
    if (second < 10) {
        second = '0' + second;
    }
    if (day < 10) {
        day = '0' + day;
    }
    if (month < 10) {
        month = '0' + month;
    }

    return hour + ':' + minute + ':' + second + ' ' + day + '/' + month;
}

const fetchPlayers = async () => {
    const playerUrs = "https://darts-api.rupr.upsl-tech.ru/twirp/duels.darts.api.Api/GetGame"
    try {

        const result = await axios.post(playerUrs, {})
        const data = result.data
        const contest = data.contest
        const startDate = contest?.started_at ?? data.day.start_time
        const strContest = JSON.stringify(contest)
        const rounds = contest.rounds
        if (prevData === strContest || !rounds) {
            return
        }
        prevData = strContest

        const id = contest.id

        const gamePlayer1 = await createPlayerIfNotExists(contest.first_player)
        const gamePlayer2 = await createPlayerIfNotExists(contest.second_player)
        const game1 = await createGameIfNotExists({id, startDate, playerId: gamePlayer1.id})
        const game2 = await createGameIfNotExists({id, startDate, playerId: gamePlayer2.id})

        const firstPlayerOutcomesAll = []
        const secondPlayerOutcomesAll = []

        rounds.forEach((round) => {
            const roundOrder = round.order
            const firstPlayerOutcomes = round.first_player_outcomes
            const secondPlayerOutcomes = round.second_player_outcomes
            firstPlayerOutcomes?.forEach((outcome) => {
                firstPlayerOutcomesAll.push({
                    sector: outcome.sector ?? 100,
                    order: `${roundOrder}.${outcome.order}`,
                    color: colors[outcome.sector] ?? "green"
                })
            })
            secondPlayerOutcomes?.forEach((outcome) => {
                secondPlayerOutcomesAll.push({
                    sector: outcome.sector ?? 100,
                    order: `${roundOrder}.${outcome.order}`,
                    color: colors[outcome.sector] ?? "green"
                })
            })
        })
        game1.outcomes = firstPlayerOutcomesAll
        await game1.save()
        game2.outcomes = secondPlayerOutcomesAll
        await game2.save()
        console.log(`Создал запись ${formatDateTime(new Date())}`);


    } catch (e) {
        console.log('cannot fetch players', e)
    }
}


export const collect = async () => {
    await fetchPlayers()

    setInterval(async ()=>{
        await fetchPlayers()
    },1500)

}
