
import {sendMessage, send} from "../../services/primus.service.js";

export default class ProtocoleAuth{

     HelloConnectMessage(dofusAccount,payload) {
        send(dofusAccount.primus, "login", {key: payload.key, salt: payload.salt, token: dofusAccount.token, username: dofusAccount.username});
    }
    HelloConnectMessageWorld(dofusAccount,payload) {
        sendMessage(primus, "AuthenticationTicketMessage", {ticket: dofusAccount.ticket, lang: "fr"});
    }
    openLoginServer(dofusAccount) {
        send(dofusAccount.primus, "connecting", {language: "fr", server: "login", client: "android", appVersion: dofusAccount.appVersion, buildVersion: dofusAccount.buildVersion});
    }
    ServersListMessage(dofusAccount, payload) {
        var servers = payload.servers.filter(function (s) {
          return s.charactersCount > 0;
        });
        var server = servers[0];
        sendMessage(dofusAccount.primus, "ServerSelectionMessage", {
          serverId: server.id
        });
      }
      SelectedServerDataMessage(dofusAccount, payload) {
        dofusAccount.ticket = payload.ticket;
        dofusAccount.server = {
          address: payload.address,
          port: payload.port,
          id: payload.serverId
        };
        send(dofusAccount.primus, "disconnecting", "SWITCHING_TO_GAME");
      }     
}
  

