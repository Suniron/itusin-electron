import Connection from "../../services/socket/connection.socket.service.js";

let connect_Protocol = new Connection();

export class ProtocoleAuthReceived{
    constructor(value){
        this.account = value;
    }

    HelloConnectMessage(payload) { connect_Protocol.HelloConnectMessage(this.account, payload)};
    ServersListMessage(payload) {connect_Protocol.ServersListMessage(this.account, payload)};
    SelectedServerDataMessage(payload){connect_Protocol.SelectedServerDataMessage(this.account, payload)};


}
export class ProtocoleAuthSender{
    constructor(value){
        this.account = value;
    }
    openLoginServer() {connect_Protocol.openLoginServer(this.account)};
}

