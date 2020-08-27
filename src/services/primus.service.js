let Primus = require("../../src/libs/primus.js");

import LogInfo from "../services/log.service.js";
import {ProtocoleAuthReceived, ProtocoleAuthSender} from "../../src/protocole/auth/index.js";
import {ProtocoleWorldReceived, ProtocoleWorldSender} from "../../src/protocole/world/index.js";


let log = new LogInfo();

export default class PrimusBotFunction{
    constructor(accountDofus){
        this.accountBot = accountDofus;
    }

    connectionToAuthServer(dofusAccount) {
        const socketURL = "https://proxyconnection.touch.dofus.com/primus/?STICKER=" + dofusAccount.sessionId;
        let _AuthSender = new ProtocoleAuthSender(dofusAccount);
        let _Auth = new ProtocoleAuthReceived(dofusAccount);
        let _AuthPacket = ProtocoleAuthReceived.toString();
        dofusAccount.setPrimus(new Primus(socketURL));
        dofusAccount.primus.on("open", () =>{
            if(!dofusAccount.world){
                _AuthSender.openLoginServer();
            }
        })
        dofusAccount.primus.on("data", payload => {
            if (_AuthPacket.includes(payload._messageType)) {
                log.logPacket(payload._messageType);
                _Auth[payload._messageType](payload);
            }
        })
        dofusAccount.primus.on("reconnected", () => console.log("reconnected"))
        dofusAccount.primus.on("error", error => console.log(error))
        dofusAccount.primus.on("end", () => {})
        dofusAccount.primus.open();
    }

}

export function send(primus, call, data = null) {
    primus.write({ call, data });
    call = call === "sendMessage" ? data.type : call;
}
export function sendMessage(primus, type) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    data = data !== undefined ? {
      type: type,
      data: data
    } : {
      type: type
    };
    send(primus, "sendMessage", data);
  }

