"use strict";

var _primusService = _interopRequireDefault(require("../../src/services/primus.service.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* Libs */
var Primus = require("../../src/libs/primus.js");

var moment = require("moment");
/* Services */


var ContextService = require("../../src/services/context.service");

var ConnectionService = require("../../src/services/connection.service");

var MapService = require("../../src/services/map.service");
/* Models */


var DofusAccount = require("../../src/models/dofus-account");

var HaapiKeysRequestModel = require("../../src/models/haapi-keys-request-model");

var ApiIdRequestModel = require("../../src/models/api-id-request-model");

var TokenRequestModel = require("../../src/models/token-request-model");

var WebSocketRequestModel = require("../../src/models/web-socket-request-model");

var newBot = new _primusService["default"]();
window.addEventListener("DOMContentLoaded", function _callee(event) {
  var dofusAccount, settingsModels, haapiKeyRequestModel, haapiKeyResponseModel, apiIdRequestModel, apiIdResponseModel, tokenRequestModel, tokenResponseModel, webSocketRequestModel;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          console.log("Demande de connexion...");
          _context.next = 3;
          return regeneratorRuntime.awrap(MapService.initialize());

        case 3:
          dofusAccount = new DofusAccount("nirhoriel", "s4EasX9E4");
          _context.next = 6;
          return regeneratorRuntime.awrap(ContextService.getSettings());

        case 6:
          settingsModels = _context.sent;
          dofusAccount.appVersion = settingsModels.appVersion;
          dofusAccount.buildVersion = settingsModels.buildVersion;
          haapiKeyRequestModel = new HaapiKeysRequestModel(dofusAccount.username, dofusAccount.password, dofusAccount.proxy);
          _context.next = 12;
          return regeneratorRuntime.awrap(ConnectionService.getHaapi(haapiKeyRequestModel));

        case 12:
          haapiKeyResponseModel = _context.sent;
          apiIdRequestModel = new ApiIdRequestModel(dofusAccount.proxy);
          _context.next = 16;
          return regeneratorRuntime.awrap(ConnectionService.getApiId(apiIdRequestModel));

        case 16:
          apiIdResponseModel = _context.sent;
          dofusAccount.sessionId = apiIdResponseModel.sessionId;
          tokenRequestModel = new TokenRequestModel(haapiKeyResponseModel.haapiKey, apiIdResponseModel.haapiId);
          _context.next = 21;
          return regeneratorRuntime.awrap(ConnectionService.getToken(tokenRequestModel));

        case 21:
          tokenResponseModel = _context.sent;
          dofusAccount.token = tokenResponseModel.token;
          webSocketRequestModel = new WebSocketRequestModel();
          newBot.connectionToAuthServer(dofusAccount);

        case 25:
        case "end":
          return _context.stop();
      }
    }
  });
});
/* Primus + Dofus function */

function send(primus, call) {
  var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  primus.write({
    call: call,
    data: data
  });
  call = call === "sendMessage" ? data.type : call;
  console.log("[".concat(moment().format("HH:mm:ss.SSS"), "] SOCKET | \x1B[32mSND\x1B[37m \x1B[30m| ").concat(call));
}

function sendMessage(primus, type) {
  var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  data = data !== undefined ? {
    type: type,
    data: data
  } : {
    type: type
  };
  send(primus, "sendMessage", data);
}

var authorizedAuthMessage = ["ConnectionFailedMessage", "HelloConnectMessage", "ServersListMessage", "SelectedServerRefusedMessage", "SelectedServerDataMessage"];
/* Authentication */

function ConnectionFailedMessage(primus, payload) {
  console.log("Echec de connexion ".concat(payload.reason));
}

function HelloConnectMessage(primus, payload, dofusAccount) {
  send(primus, "login", {
    key: payload.key,
    salt: payload.salt,
    token: dofusAccount.token,
    username: dofusAccount.username
  });
}

function ServersListMessage(primus, payload) {
  var servers = payload.servers.filter(function (s) {
    return s.charactersCount > 0;
  });
  var server = servers[0];
  sendMessage(primus, "ServerSelectionMessage", {
    serverId: server.id
  });
}

function SelectedServerRefusedMessage(primus, payload) {
  return regeneratorRuntime.async(function SelectedServerRefusedMessage$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (payload.serverStatus === 4) {
            console.log("Serveur en maintenance");
          } else {
            console.log("SelectedServerRefusedMessage");
          }

        case 1:
        case "end":
          return _context2.stop();
      }
    }
  });
}

function SelectedServerDataMessage(primus, payload, dofusAccount) {
  dofusAccount.ticket = payload.ticket;
  dofusAccount.server = {
    address: payload.address,
    port: payload.port,
    id: payload.serverId
  };
  send(primus, "disconnecting", "SWITCHING_TO_GAME");
  var webSocketRequestModel = new WebSocketRequestModel();
  connectionToGameServer(webSocketRequestModel, dofusAccount);
}

var authorizedGameMessage = ["HelloGameMessage"];

function connectionToGameServer(webSocketRequestModel, dofusAccount) {
  var socketURL = "https://proxyconnection.touch.dofus.com/primus/?STICKER=" + dofusAccount.sessionId;
  var primus = new Primus(socketURL);
  primus.on("open", function () {
    return openGameServer(primus, dofusAccount);
  });
  primus.on("data", function (payload) {
    if (authorizedGameMessage.includes(payload._messageType)) {
      console.log("[".concat(moment().format("HH:mm:ss.SSS"), "] SOCKET | \x1B[34mRCV\x1B[37m \x1B[30m| ").concat(payload._messageType));

      switch (payload._messageType) {
        case "HelloGameMessage":
          HelloGameMessage(primus, payload, dofusAccount);
          break;
      }
    }
  });
  primus.on("reconnected", function () {
    return console.log("reconnected");
  });
  primus.on("error", function (error) {
    return console.log(error);
  });
  primus.on("end", function () {});
  primus.open();
}
/* Game */


function openGameServer(primus, dofusAccount) {
  send(primus, "connecting", {
    language: "fr",
    server: dofusAccount.server,
    client: "android",
    appVersion: dofusAccount.appVersion,
    buildVersion: dofusAccount.buildVersion
  });
}

function HelloGameMessage(primus, payload, dofusAccount) {
  console.log("Well Done !");
  send(primus, "disconnecting", "CLIENT_CLOSING");
}