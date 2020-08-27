import Connection from "../../services/socket/connection.socket.service.js";

let connect_Protocol = new Connection();

export class ProtocoleWorldReceived{
    constructor(value){
        this.account = value;
    }

    HelloConnectMessage(payload) { connect_Protocol.HelloConnectMessageWorld(this.account, payload)};


}
export class ProtocoleWorldSender{
    constructor(value){
        this.account = value;
    }
}

