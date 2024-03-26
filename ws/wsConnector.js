import axios from "axios";
import Websocket from "ws";


const initialMessage1 = {"method": 1, "params": {"channel": "darts_game_events"}, "id": 2}
const initialMessage2 = {"method": 1, "params": {"channel": "darts_bet_events#mvp_107032474_squ"}, "id": 3}
const initMessageStr = JSON.stringify(initialMessage1) + '\n' + JSON.stringify(initialMessage2);


export class WsConnector {
    sessionId
    ws
    wsToken = ""
    refreshInterval = 30 * 60 * 1000
    timeoutId
    onMessage

    constructor({sessionId, ws,onMessage}) {
        this.sessionId = sessionId
        this.ws = ws
        this.onMessage = onMessage
    }


    connect = async () => {
        if(this.ws){
            this.ws.close()
        }
        this.ws  = new Websocket('wss://ws.rupr.upsl-tech.ru/connection/websocket'); // Replace with your WebSocket server URL
        this.ws.on('open', async () => {
            try{
                console.log('Создаем ws token')
                const result = await axios.post("https://gateway-svc.rupr.upsl-tech.ru/twirp/duels.gateway.api.Gateway/GetWsToken",
                    {
                        "platform_id": "parimatchkz",
                        "session_token": this.sessionId
                    })
                this.wsToken = result.data["ws_token"]
                this.ws.send(JSON.stringify({"params": {"token": this.wsToken, "name": "js"}, "id": 1}))
            }catch (e) {
                console.log("Не получилось создать ws token")
                this.ws.close()
            }
        });

        this.ws.on('message', async (message) => {
            let parsedMessage = null
            try {
                parsedMessage = JSON.parse(message)
            } catch (e) {

            }
            if (!parsedMessage) {
                return
            } else if (!!parsedMessage?.result?.client) {
                this.ws.send(initMessageStr)
                console.log('init message')
                return
            } else if (parsedMessage?.error?.message === "token expired") {
                this.ws.close()
                this.connect()
                return
            }
            this.onMessage(parsedMessage)
        })

        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
        }
        // this.timeoutId = setTimeout(()=>{
        //     console.log('рефрешим токен')
        //     this.connect()
        //
        // }, this.refreshInterval)
    }

}
