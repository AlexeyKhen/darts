import axios from "axios";
import {Game, Player} from "../models/models.js";
import {WsConnector} from "./wsConnector.js";
import dotenv from "dotenv";

const config = dotenv.config().parsed

const sessionId = "Vtd0U-ekX6h35kh-gemvEMCh10hLFiomt3f5kEjvyRkAsXkXeL2h-3olh1yuFYJm_squ"

let game1 = null
let game2 = null
let gamePlayer1 = null
let gamePlayer2 = null

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


const fetchPlayers = async () => {
    const playerUrs = "https://darts-api.rupr.upsl-tech.ru/twirp/duels.darts.api.Api/GetGame"
    try {
        console.log('fetching games')
        const result = await axios.post(playerUrs, {})
        const data = result.data
        const startDate = data.day.start_time
        const id = data.contest.id
        gamePlayer1 = await createPlayerIfNotExists(data.contest.first_player)
        gamePlayer2 = await createPlayerIfNotExists(data.contest.second_player)
        game1 = await createGameIfNotExists({id, startDate, playerId: gamePlayer1.id})
        game2 = await createGameIfNotExists({id, startDate, playerId: gamePlayer2.id})

    } catch (e) {
        console.log('cannot fetch players', e)
    }
}


export const collect = async () => {
    await fetchPlayers()

    const tokenChecker = new WsConnector({
        sessionId: config["SESSION_ID"],
        onMessage: async (parsedMessage) => {
            try {
                const data = parsedMessage.result.data.data
                const status = data.contestStatusUpdatedEvent?.status
                const outcomeInputedEvent = data.outcomeInputedEvent

                if (!game1 || !game2 || (status && status === "LIVE")) {
                    await fetchPlayers()
                    console.log('Игра ')
                } else if (status && status === "ENDED" || (outcomeInputedEvent && outcomeInputedEvent.contestId !== game1.id)) {
                    game1 = null
                    game2 = null
                    gamePlayer1 = null
                    gamePlayer2 = null
                    console.log('Игра закончилась')
                    return
                }
                const rounds = outcomeInputedEvent?.rounds
                const firstPlayerOutcomesAll = []
                const secondPlayerOutcomesAll = []

                rounds?.forEach((round) => {
                    const roundOrder = round.order
                    const firstPlayerOutcomes = round.firstPlayerOutcomes
                    const secondPlayerOutcomes = round.secondPlayerOutcomes
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
                console.log(`Обработал сообщение сектор ${outcomeInputedEvent?.sector}`);


            } catch (e) {
                console.log('Ошибка парсинга', e)
            }
        }
    })

    tokenChecker.connect()
}
