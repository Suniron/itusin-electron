"use strict";

/* Libs */
var Primus = require("../../src/libs/primus.js");

var moment = require("moment");
/* Services */


var ContextService = require("../../src/services/context.service");

var ConnectionService = require("../../src/services/connection.service");

var MapService = require("../../src/services/map.service");

var PathFindingService = require("../../src/services/pathfinding.service");

var FigthService = require("../../src/services/fight.service");
/* Models */


var DofusAccount = require("../../src/models/dofus-account");

var HaapiKeysRequestModel = require("../../src/models/haapi-keys-request-model");

var ApiIdRequestModel = require("../../src/models/api-id-request-model");

var TokenRequestModel = require("../../src/models/token-request-model");

var WebSocketRequestModel = require("../../src/models/web-socket-request-model");

var packetsToSend = [];
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
          connectionToAuthServer(webSocketRequestModel, dofusAccount);

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

function connectionToAuthServer(webSocketRequestModel, dofusAccount) {
  var socketURL = "https://proxyconnection.touch.dofus.com/primus/?STICKER=" + dofusAccount.sessionId;
  primus = new Primus(socketURL);
  primus.on("open", function () {
    return openLoginServer(primus, dofusAccount);
  });
  primus.on("data", function (payload) {
    console.log(payload._messageType);

    if (authorizedAuthMessage.includes(payload._messageType)) {
      console.log("[".concat(moment().format("HH:mm:ss.SSS"), "] SOCKET | \x1B[34mRCV\x1B[37m \x1B[30m| ").concat(payload._messageType));

      switch (payload._messageType) {
        case "ConnectionFailedMessage":
          ConnectionFailedMessage(primus, payload);
          break;

        case "HelloConnectMessage":
          HelloConnectMessage(primus, payload, dofusAccount);
          break;

        case "ServersListMessage":
          ServersListMessage(primus, payload);
          break;

        case "SelectedServerRefusedMessage":
          SelectedServerRefusedMessage(primus, payload);
          break;

        case "SelectedServerDataMessage":
          SelectedServerDataMessage(primus, payload, dofusAccount);
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
/* Authentication */


function openLoginServer(primus, dofusAccount) {
  send(primus, "connecting", {
    language: "fr",
    server: "login",
    client: "android",
    appVersion: dofusAccount.appVersion,
    buildVersion: dofusAccount.buildVersion
  });
}

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
            console.log(payload);
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

var authorizedGameMessage = ["HelloGameMessage", "TrustStatusMessage", "CharactersListMessage", "CharacterSelectedSuccessMessage", "CurrentMapMessage", "MapComplementaryInformationsDataMessage", "BasicNoOperationMessage", "BasicAckMessage", "SequenceNumberRequestMessage", "BasicLatencyStatsRequestMessage", "GameEntitiesDispositionMessage", "SequenceEndMessage", "GameFightTurnReadyRequestMessage", "GameFightTurnStartMessage", "GameActionFightSpellCastMessage", "GameActionFightNoSpellCastMessage", "GameMapMovementMessage", "GameActionFightDeathMessage", "GameFightEndMessage", "CharacterSelectedForceMessage", "FighterStatsListMessage", "CharacterStatsListMessage", "GameFightPlacementPossiblePositionsMessage"];

function connectionToGameServer(webSocketRequestModel, dofusAccount) {
  var socketURL = "https://proxyconnection.touch.dofus.com/primus/?STICKER=" + dofusAccount.sessionId;
  primus = new Primus(socketURL);
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

        case "TrustStatusMessage":
          TrustStatusMessage(primus, payload);
          break;

        case "CharactersListMessage":
          CharactersListMessage(primus, payload);
          break;

        case "CharacterSelectedSuccessMessage":
          CharacterSelectedSuccessMessage(primus, payload, dofusAccount);
          break;

        case "CurrentMapMessage":
          CurrentMapMessage(primus, payload, dofusAccount);
          break;

        case "MapComplementaryInformationsDataMessage":
          MapComplementaryInformationsDataMessage(primus, payload, dofusAccount);
          break;

        case "BasicNoOperationMessage":
          BasicNoOperationMessage(primus, payload, dofusAccount);
          break;

        case "BasicAckMessage":
          BasicAckMessage(primus, payload, dofusAccount);
          break;

        case "SequenceNumberRequestMessage":
          SequenceNumberRequestMessage(primus, payload);
          break;

        case "BasicLatencyStatsRequestMessage":
          BasicLatencyStatsRequestMessage(primus, payload);
          break;

        case "GameEntitiesDispositionMessage":
          GameEntitiesDispositionMessage(primus, payload, dofusAccount);
          break;

        case "SequenceEndMessage":
          SequenceEndMessage(primus, payload, dofusAccount);
          break;

        case "GameFightTurnReadyRequestMessage":
          GameFightTurnReadyRequestMessage(primus, payload);
          break;

        case "GameFightTurnStartMessage":
          GameFightTurnStartMessage(primus, payload, dofusAccount);
          break;

        case "GameActionFightSpellCastMessage":
          GameActionFightSpellCastMessage(primus, payload, dofusAccount);
          break;

        case "GameActionFightNoSpellCastMessage":
          GameActionFightNoSpellCastMessage(primus, payload);
          break;

        case "GameMapMovementMessage":
          GameMapMovementMessage(primus, payload, dofusAccount);
          break;

        case "GameActionFightDeathMessage":
          GameActionFightDeathMessage(primus, payload, dofusAccount);
          break;

        case "GameFightEndMessage":
          GameFightEndMessage(primus, payload);
          break;

        case "CharacterSelectedForceMessage":
          CharacterSelectedForceMessage(primus, payload, dofusAccount);
          break;

        case "FighterStatsListMessage":
          FighterStatsListMessage(primus, payload, dofusAccount);
          break;

        case "CharacterStatsListMessage":
          CharacterStatsListMessage(primus, payload, dofusAccount);
          break;

        case "GameFightPlacementPossiblePositionsMessage":
          GameFightPlacementPossiblePositionsMessage(primus, payload, dofusAccount);
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
  sendMessage(primus, "AuthenticationTicketMessage", {
    ticket: dofusAccount.ticket,
    lang: "fr"
  });
}

function TrustStatusMessage(primus, payload) {
  sendMessage(primus, "CharactersListRequestMessage", {
    type: "CharactersListRequestMessage"
  });
}

function CharactersListMessage(primus, payload) {
  sendMessage(primus, "CharacterFirstSelectionMessage", {
    id: payload.characters[0].id,
    doTutorial: false
  });
}

function CharacterSelectedSuccessMessage(primus, payload, dofusAccount) {
  dofusAccount.characterId = payload.infos.id;
  dofusAccount.level = payload.infos.level;
  dofusAccount.characterName = payload.infos.name;
  sendMessage(primus, "GameContextCreateRequestMessage");
}

function CurrentMapMessage(primus, payload, dofusAccount) {
  return regeneratorRuntime.async(function CurrentMapMessage$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          dofusAccount.mapId = payload.mapId;
          _context3.next = 3;
          return regeneratorRuntime.awrap(MapService.resolveMapPosition(payload.mapId));

        case 3:
          dofusAccount.mapCoord = _context3.sent;
          _context3.next = 6;
          return regeneratorRuntime.awrap(MapService.resolveMap(payload.mapId));

        case 6:
          dofusAccount.map = _context3.sent;
          sendMessage(primus, "MapInformationsRequestMessage", {
            mapId: dofusAccount.mapId
          });

        case 8:
        case "end":
          return _context3.stop();
      }
    }
  });
}

var readyForGameMapMovementRequestMessage = false;
var readyForGameMapMovementConfirmMessage = false;
var readyForChangeMapMessage = false;
var readyForGameMapMovementFightRequestMessage = false;
var readyForGameMapMovementFightConfirmMessage = false;
var readyForGameRolePlayAttackMonsterRequestMessage = false;
var readyForGameFightPlacementPositionRequestMessage = false;
var GameFightPlacementPositionDone = false;
var readyForGameFightTurn = false;
var readyForGameMove = false;
var readyForGameAction = false;
var readyForGameFightTurnFinishMessage = false;
var sequenceNumber = 0;
var gameFightStarted = false;
var nbFightDone = 0;
var nbFightToDo = 1;
var MIN_MONSTER = 1;
var MAX_MONSTER = 8;
var SPELL_ID = 7677; // pied du sacrieur

var authorizedMaps = ["-1,-14", "0,-14"];
var authorizedMoveMaps = ["-1,-14"];
var authorizedFightMaps = ["0,-14"];

function MapComplementaryInformationsDataMessage(primus, payload, dofusAccount) {
  var character, monsters, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, monster;

  return regeneratorRuntime.async(function MapComplementaryInformationsDataMessage$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          console.log(dofusAccount.mapCoord);

          if (!(nbFightDone === nbFightToDo)) {
            _context4.next = 3;
            break;
          }

          return _context4.abrupt("return");

        case 3:
          if (!authorizedMaps.includes(dofusAccount.mapCoord)) {
            _context4.next = 33;
            break;
          }

          character = payload.actors.find(function (a) {
            return a.contextualId === dofusAccount.characterId;
          });

          if (character) {
            dofusAccount.characterCellId = character.disposition.cellId;
          }

          if (authorizedMoveMaps.includes(dofusAccount.mapCoord)) {
            // set move packets for current map coord
            setMovePacketsforCurrentCoord(dofusAccount);
          }

          if (!(authorizedFightMaps.includes(dofusAccount.mapCoord) && !gameFightStarted)) {
            _context4.next = 31;
            break;
          }

          monsters = payload.actors.filter(function (actor) {
            return actor.contextualId < 0 && !actor.npcId;
          });
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context4.prev = 12;

          for (_iterator = monsters[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            monster = _step.value;
            console.log("".concat(monster.staticInfos.mainCreatureLightInfos.staticInfos.nameId, ", ").concat(monster.staticInfos.underlings.length + 1, " Monster(s) id:").concat(monster.contextualId));
          }

          _context4.next = 20;
          break;

        case 16:
          _context4.prev = 16;
          _context4.t0 = _context4["catch"](12);
          _didIteratorError = true;
          _iteratorError = _context4.t0;

        case 20:
          _context4.prev = 20;
          _context4.prev = 21;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 23:
          _context4.prev = 23;

          if (!_didIteratorError) {
            _context4.next = 26;
            break;
          }

          throw _iteratorError;

        case 26:
          return _context4.finish(23);

        case 27:
          return _context4.finish(20);

        case 28:
          dofusAccount.groupMonsters = monsters.filter(function (monster) {
            return monster.staticInfos.underlings.length >= MIN_MONSTER - 1 && monster.staticInfos.underlings.length <= MAX_MONSTER - 1;
          });
          console.log("".concat(dofusAccount.groupMonsters.length, " groupes \xE9ligible(s)")); // set fight packets for current map coord

          setFightPacketsforCurrentCoord(dofusAccount);

        case 31:
          _context4.next = 34;
          break;

        case 33:
          console.log("".concat(dofusAccount.mapCoord, " n'est pas compris dans le cas de v\xE9rification"));

        case 34:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[12, 16, 20, 28], [21,, 23, 27]]);
}

function BasicNoOperationMessage(primus, payload, dofusAccount) {
  var packet, rowPair;
  return regeneratorRuntime.async(function BasicNoOperationMessage$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          if (!(nbFightDone === nbFightToDo)) {
            _context5.next = 4;
            break;
          }

          console.log("Well Done !");
          send(primus, "disconnecting", "CLIENT_CLOSING");
          return _context5.abrupt("return");

        case 4:
          // Move
          if (readyForChangeMapMessage) {
            readyForChangeMapMessage = false;
            packet = packetsToSend.shift();
            sendMessage(primus, packet.call, packet.data);
          }

          if (readyForGameMapMovementConfirmMessage) {
            readyForGameMapMovementConfirmMessage = false;
            packet = packetsToSend.shift();
            sendMessage(primus, packet.call, packet.data);
            packetsToSend.push({
              type: "sendMessage",
              call: "ChangeMapMessage",
              data: {
                mapId: dofusAccount.newMapId
              }
            });
            readyForChangeMapMessage = true;
          }

          if (readyForGameMapMovementRequestMessage) {
            readyForGameMapMovementRequestMessage = false;
            packet = packetsToSend.shift();
            sendMessage(primus, packet.call, packet.data);
            packetsToSend.push({
              type: "sendMessage",
              call: "GameMapMovementConfirmMessage",
              data: null
            });
            readyForGameMapMovementConfirmMessage = true;
          } // Fight


          if (readyForGameRolePlayAttackMonsterRequestMessage) {
            readyForGameRolePlayAttackMonsterRequestMessage = false;
            packet = packetsToSend.shift();
            sendMessage(primus, packet.call, packet.data);
          }

          if (readyForGameMapMovementFightConfirmMessage) {
            readyForGameMapMovementFightConfirmMessage = false;
            packet = packetsToSend.shift();
            sendMessage(primus, packet.call, packet.data);
            packetsToSend.push({
              type: "sendMessage",
              call: "GameRolePlayAttackMonsterRequestMessage",
              data: {
                monsterGroupId: dofusAccount.monsterGroupId
              }
            });
            readyForGameRolePlayAttackMonsterRequestMessage = true;
          }

          if (readyForGameMapMovementFightRequestMessage) {
            readyForGameMapMovementFightRequestMessage = false;
            packet = packetsToSend.shift();
            sendMessage(primus, packet.call, packet.data);
            packetsToSend.push({
              type: "sendMessage",
              call: "GameMapMovementConfirmMessage",
              data: null
            });
            readyForGameMapMovementFightConfirmMessage = true;
          } // During fight


          if (readyForGameFightTurn) {
            readyForGameFightTurn = false;
            FigthService.resolveDistanceFrom(dofusAccount.monstersInFight, dofusAccount.characterCellId);
            FigthService.orderByDistanceAsc(dofusAccount.monstersInFight);
            rowPair = Math.floor(dofusAccount.characterCellId / 14) % 2 === 0;

            if (rowPair && (dofusAccount.monstersInFight[0].x === -1 && dofusAccount.monstersInFight[0].y === -1 || dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === -1 || dofusAccount.monstersInFight[0].x === -1 && dofusAccount.monstersInFight[0].y === 1 || dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === 1) || !rowPair && (dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === -1 || dofusAccount.monstersInFight[0].x === 1 && dofusAccount.monstersInFight[0].y === -1 || dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === 1 || dofusAccount.monstersInFight[0].x === 1 && dofusAccount.monstersInFight[0].y === 1)) {
              readyForGameAction = true;
            } else {
              readyForGameMove = true;
            }
          }

          if (readyForGameAction) {
            readyForGameAction = false;
            gameAction(primus, dofusAccount);
          }

          if (readyForGameMove) {
            readyForGameMove = false;
            gameMove(primus, dofusAccount);
          }

        case 13:
        case "end":
          return _context5.stop();
      }
    }
  });
}

function BasicAckMessage(primus, payload, dofusAccount) {
  return regeneratorRuntime.async(function BasicAckMessage$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
        case "end":
          return _context6.stop();
      }
    }
  });
}

function SequenceNumberRequestMessage(primus, payload) {
  sequenceNumber += 1;
  sendMessage(primus, "SequenceNumberMessage", {
    number: sequenceNumber
  });
}

function BasicLatencyStatsRequestMessage(primus, payload) {
  sendMessage(primus, "BasicLatencyStatsMessage", {
    latency: 262,
    sampleCount: 12,
    max: 50
  });
}

function SequenceEndMessage(primus, payload, dofusAccount) {
  dofusAccount.acknowledgementActionId = payload.actionId;
  sendMessage(primus, "GameActionAcknowledgementMessage", {
    valid: true,
    actionId: dofusAccount.acknowledgementActionId
  });

  if (payload.authorId === dofusAccount.characterId) {
    sendMessage(primus, "GameFightTurnFinishMessage");
  }
}

function GameEntitiesDispositionMessage(primus, payload, dofusAccount) {
  var character;
  return regeneratorRuntime.async(function GameEntitiesDispositionMessage$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          if (gameFightStarted) {
            _context7.next = 5;
            break;
          }

          gameFightStarted = true;
          _context7.next = 4;
          return regeneratorRuntime.awrap(new Promise(function (resolve) {
            return setTimeout(resolve, 10000);
          }));

        case 4:
          sendMessage(primus, "GameFightReadyMessage", {
            isReady: true
          });

        case 5:
          character = payload.dispositions.find(function (disposition) {
            return disposition.id === dofusAccount.characterId;
          });

          if (character) {
            dofusAccount.characterCellId = character.cellId;
          }

          dofusAccount.playersInFight = payload.dispositions.filter(function (disposition) {
            return disposition.id !== dofusAccount.characterId && disposition.id > 0;
          });
          dofusAccount.monstersInFight = payload.dispositions.filter(function (disposition) {
            return disposition.id !== dofusAccount.characterId && disposition.id < 0;
          });

          if (dofusAccount.monstersInFight.length) {
            readyForGameFightPlacementPositionRequestMessage = true;
          }

        case 10:
        case "end":
          return _context7.stop();
      }
    }
  });
}

function GameFightTurnReadyRequestMessage(primus, payload) {
  sendMessage(primus, "GameFightTurnReadyMessage", {
    isReady: true
  });
}

function GameFightTurnStartMessage(primus, payload, dofusAccount) {
  return regeneratorRuntime.async(function GameFightTurnStartMessage$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          sendMessage(primus, "GameActionAcknowledgementMessage", {
            valid: true
          });

          if (payload.id === dofusAccount.characterId) {
            console.log("D\xE9but de tour, Je suis sur la cellId ".concat(dofusAccount.characterCellId));
            readyForGameFightTurn = true;
          }

        case 2:
        case "end":
          return _context8.stop();
      }
    }
  });
}

function GameActionFightSpellCastMessage(primus, payload, dofusAccount) {
  return regeneratorRuntime.async(function GameActionFightSpellCastMessage$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          if (payload.sourceId === dofusAccount.characterId) {
            console.log("Le sort ".concat(SPELL_ID, "  \xE0 \xE9t\xE9 lanc\xE9"));
            gameAction(primus, dofusAccount);
          }

        case 1:
        case "end":
          return _context9.stop();
      }
    }
  });
}

function GameActionFightNoSpellCastMessage(primus, payload) {}

function GameMapMovementMessage(primus, payload, dofusAccount) {
  var player, monster;
  return regeneratorRuntime.async(function GameMapMovementMessage$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          if (gameFightStarted && dofusAccount.characterId === payload.actorId) {
            dofusAccount.characterCellId = payload.keyMovements[payload.keyMovements.length - 1];
            gameMove(primus, dofusAccount);
          } else if (gameFightStarted) {
            player = dofusAccount.playersInFight.find(function (player) {
              return player.id === payload.actorId;
            });
            if (player) player.cellId = payload.keyMovements[payload.keyMovements.length - 1];
            monster = dofusAccount.monstersInFight.find(function (monster) {
              return monster.id === payload.actorId;
            });
            if (monster) monster.cellId = payload.keyMovements[payload.keyMovements.length - 1];
          }

        case 1:
        case "end":
          return _context10.stop();
      }
    }
  });
}

function GameActionFightDeathMessage(primus, payload, dofusAccount) {
  console.log("".concat(payload.targetId, " is Death :)"));
  dofusAccount.monstersInFight = dofusAccount.monstersInFight.filter(function (monster) {
    return monster.id !== payload.targetId;
  });
}

function GameFightEndMessage(primus, payload) {
  console.log("Combat termin\xE9 en ".concat(Math.ceil(payload.duration / 1000), " secondes."));
  gameFightStarted = false;
  nbFightDone++;
}

function CharacterSelectedForceMessage(primus, payload, dofusAccount) {
  gameFightStarted = true;
  dofusAccount.characterId = payload.id;
  sendMessage(primus, "CharacterSelectedForceReadyMessage");
}

function FighterStatsListMessage(primus, payload, dofusAccount) {
  dofusAccount.currentPA = payload.stats.actionPointsCurrent + payload.stats.additionnalPoints;
  dofusAccount.currentPM = payload.stats.movementPointsCurrent;
}

function CharacterStatsListMessage(primus, payload, dofusAccount) {
  dofusAccount.currentPA = payload.stats.actionPointsCurrent + payload.stats.additionnalPoints;
  dofusAccount.currentPM = payload.stats.movementPointsCurrent;
}

function GameFightPlacementPossiblePositionsMessage(primus, payload, dofusAccount) {
  dofusAccount.positionsForChallengers = payload.positionsForChallengers.map(function (position) {
    return new Object({
      cellId: position
    });
  });
}

function setMovePacketsforCurrentCoord(dofusAccount) {
  return regeneratorRuntime.async(function setMovePacketsforCurrentCoord$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _context11.next = 2;
          return regeneratorRuntime.awrap(PathFindingService.constructMapPoints());

        case 2:
          _context11.next = 4;
          return regeneratorRuntime.awrap(PathFindingService.initGrid());

        case 4:
          _context11.next = 6;
          return regeneratorRuntime.awrap(PathFindingService.fillPathGrid(dofusAccount.map));

        case 6:
          _context11.t0 = dofusAccount.mapCoord;
          _context11.next = _context11.t0 === "-1,-14" ? 9 : 11;
          break;

        case 9:
          dofusAccount.dir = "left";
          return _context11.abrupt("break", 11);

        case 11:
          _context11.next = 13;
          return regeneratorRuntime.awrap(PathFindingService.getRandomCellId(dofusAccount));

        case 13:
          dofusAccount.targetCellId = _context11.sent;
          _context11.next = 16;
          return regeneratorRuntime.awrap(MapService.resolveNewMapId(dofusAccount.map, dofusAccount.dir));

        case 16:
          dofusAccount.newMapId = _context11.sent;
          _context11.next = 19;
          return regeneratorRuntime.awrap(PathFindingService.getPath(dofusAccount.characterCellId, dofusAccount.targetCellId, dofusAccount.occupiedCells, true, false));

        case 19:
          dofusAccount.keyMovements = _context11.sent;
          packetsToSend.push({
            type: "sendMessage",
            call: "GameMapMovementRequestMessage",
            data: {
              keyMovements: PathFindingService.compressPath(dofusAccount.keyMovements),
              mapId: dofusAccount.mapId
            }
          });
          readyForGameMapMovementRequestMessage = true;

        case 22:
        case "end":
          return _context11.stop();
      }
    }
  });
}

function setFightPacketsforCurrentCoord(dofusAccount) {
  var groupToAttack;
  return regeneratorRuntime.async(function setFightPacketsforCurrentCoord$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          if (!dofusAccount.groupMonsters.length) {
            _context12.next = 24;
            break;
          }

          _context12.next = 3;
          return regeneratorRuntime.awrap(PathFindingService.constructMapPoints());

        case 3:
          _context12.next = 5;
          return regeneratorRuntime.awrap(PathFindingService.initGrid());

        case 5:
          _context12.next = 7;
          return regeneratorRuntime.awrap(PathFindingService.fillPathGrid(dofusAccount.map));

        case 7:
          groupToAttack = dofusAccount.groupMonsters[0];
          console.log("Attaque ".concat(groupToAttack.staticInfos.mainCreatureLightInfos.staticInfos.nameId, ", ").concat(groupToAttack.staticInfos.underlings.length + 1, " Monster(s) id:").concat(groupToAttack.contextualId));
          dofusAccount.monsterNumber = groupToAttack.staticInfos.underlings.length + 1;
          dofusAccount.monsterToAttackCellId = groupToAttack.disposition.cellId;
          dofusAccount.monsterGroupId = groupToAttack.contextualId;
          console.log('Je suis sur la cellId', dofusAccount.characterCellId);
          console.log('Le monstre est sur la cellId', dofusAccount.monsterToAttackCellId);

          if (!(dofusAccount.characterCellId !== dofusAccount.monsterToAttackCellId)) {
            _context12.next = 22;
            break;
          }

          _context12.next = 17;
          return regeneratorRuntime.awrap(PathFindingService.getPath(dofusAccount.characterCellId, dofusAccount.monsterToAttackCellId, dofusAccount.occupiedCells, true, false));

        case 17:
          dofusAccount.keyMovements = _context12.sent;
          packetsToSend.push({
            type: "sendMessage",
            call: "GameMapMovementRequestMessage",
            data: {
              keyMovements: PathFindingService.compressPath(dofusAccount.keyMovements),
              mapId: dofusAccount.mapId
            }
          });
          readyForGameMapMovementFightRequestMessage = true;
          _context12.next = 24;
          break;

        case 22:
          packetsToSend.push({
            type: "sendMessage",
            call: "GameRolePlayAttackMonsterRequestMessage",
            data: {
              monsterGroupId: dofusAccount.monsterGroupId
            }
          });
          readyForGameRolePlayAttackMonsterRequestMessage = true;

        case 24:
        case "end":
          return _context12.stop();
      }
    }
  });
}

function gameAction(primus, dofusAccount) {
  var rowPair;
  return regeneratorRuntime.async(function gameAction$(_context13) {
    while (1) {
      switch (_context13.prev = _context13.next) {
        case 0:
          console.log("gameAction ".concat(dofusAccount.currentPA, " PA"));

          if (!(dofusAccount.currentPA < 4)) {
            _context13.next = 7;
            break;
          }

          console.log("plus de PA dispo, fin de tour");
          dofusAccount.setPA(6);
          dofusAccount.setPM(3);
          sendMessage(primus, "GameFightTurnFinishMessage");
          return _context13.abrupt("return");

        case 7:
          rowPair = Math.floor(dofusAccount.characterCellId / 14) % 2 === 0;

          if (rowPair && (dofusAccount.monstersInFight[0].x === -1 && dofusAccount.monstersInFight[0].y === -1 || dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === -1 || dofusAccount.monstersInFight[0].x === -1 && dofusAccount.monstersInFight[0].y === 1 || dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === 1) || !rowPair && (dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === -1 || dofusAccount.monstersInFight[0].x === 1 && dofusAccount.monstersInFight[0].y === -1 || dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === 1 || dofusAccount.monstersInFight[0].x === 1 && dofusAccount.monstersInFight[0].y === 1)) {
            sendMessage(primus, "GameActionFightCastRequestMessage", {
              spellId: SPELL_ID,
              cellId: dofusAccount.characterCellId
            });
            dofusAccount.removePA(4);
          } else {
            sendMessage(primus, "GameFightTurnFinishMessage");
          }

        case 9:
        case "end":
          return _context13.stop();
      }
    }
  });
}

function gameMove(primus, dofusAccount) {
  var rowPair, player, monster;
  return regeneratorRuntime.async(function gameMove$(_context14) {
    while (1) {
      switch (_context14.prev = _context14.next) {
        case 0:
          console.log("gameMove ".concat(dofusAccount.currentPM, " PM"));

          if (!(dofusAccount.currentPM === 0)) {
            _context14.next = 6;
            break;
          }

          console.log("plus de PM dispo, on essaye d'attaquer");
          gameAction(primus, dofusAccount);
          _context14.next = 24;
          break;

        case 6:
          console.log("Je me déplace de 1pm");
          rowPair = Math.floor(dofusAccount.characterCellId / 14) % 2 === 0;
          dofusAccount.availableCellsToMove = FigthService.getAvailableCellsToMove(rowPair, dofusAccount);

          for (player in dofusAccount.playersInFight) {
            dofusAccount.availableCellsToMove = dofusAccount.availableCellsToMove.filter(function (cell) {
              return cell.cellId !== player.cellId;
            });
          }

          for (monster in dofusAccount.monstersInFight) {
            dofusAccount.availableCellsToMove = dofusAccount.availableCellsToMove.filter(function (cell) {
              return cell.cellId !== monster.cellId;
            });
          }

          FigthService.resolveDistanceFrom(dofusAccount.availableCellsToMove, dofusAccount.monstersInFight[0].cellId);
          FigthService.orderByDistanceAsc(dofusAccount.availableCellsToMove);
          _context14.next = 15;
          return regeneratorRuntime.awrap(PathFindingService.constructMapPoints());

        case 15:
          _context14.next = 17;
          return regeneratorRuntime.awrap(PathFindingService.initGrid());

        case 17:
          _context14.next = 19;
          return regeneratorRuntime.awrap(PathFindingService.fillPathGrid(dofusAccount.map));

        case 19:
          _context14.next = 21;
          return regeneratorRuntime.awrap(PathFindingService.getPath(dofusAccount.characterCellId, dofusAccount.availableCellsToMove[0].cellId, dofusAccount.occupiedCells, false, false));

        case 21:
          dofusAccount.keyMovements = _context14.sent;
          sendMessage(primus, "GameMapMovementRequestMessage", {
            keyMovements: dofusAccount.keyMovements,
            mapId: dofusAccount.mapId
          });
          dofusAccount.removePM(1);

        case 24:
        case "end":
          return _context14.stop();
      }
    }
  });
}