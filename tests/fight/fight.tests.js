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

window.addEventListener("DOMContentLoaded", async (event) => {
	console.log("Demande de connexion...");

	await MapService.initialize();

	const dofusAccount = new DofusAccount("nirhoriel", "s4EasX9E4");

	const settingsModels = await ContextService.getSettings();
	dofusAccount.appVersion = settingsModels.appVersion;
	dofusAccount.buildVersion = settingsModels.buildVersion;

	const haapiKeyRequestModel = new HaapiKeysRequestModel(dofusAccount.username, dofusAccount.password, dofusAccount.proxy);
	const haapiKeyResponseModel = await ConnectionService.getHaapi(haapiKeyRequestModel);

	const apiIdRequestModel = new ApiIdRequestModel(dofusAccount.proxy);
	const apiIdResponseModel = await ConnectionService.getApiId(apiIdRequestModel);
	dofusAccount.sessionId = apiIdResponseModel.sessionId;

	const tokenRequestModel = new TokenRequestModel(haapiKeyResponseModel.haapiKey, apiIdResponseModel.haapiId);
	const tokenResponseModel = await ConnectionService.getToken(tokenRequestModel);
	dofusAccount.token = tokenResponseModel.token;

	const webSocketRequestModel = new WebSocketRequestModel();
	connectionToAuthServer(webSocketRequestModel, dofusAccount);
});

/* Primus + Dofus function */
function send(primus, call, data = null) {
	primus.write({ call, data });
	call = call === "sendMessage" ? data.type : call;
	console.log(`[${moment().format("HH:mm:ss.SSS")}] SOCKET | \u001b[32mSND\u001b[37m \u001b[30m| ${call}`);
}
function sendMessage(primus, type, data = null) {
	data = data !== undefined ? { type: type, data: data} : { type: type};
	send(primus, "sendMessage", data);
}
const authorizedAuthMessage = [
	"ConnectionFailedMessage",
	"HelloConnectMessage",
	"ServersListMessage",
	"SelectedServerRefusedMessage",
	"SelectedServerDataMessage"
];
function connectionToAuthServer(webSocketRequestModel, dofusAccount) {
	const socketURL = "https://proxyconnection.touch.dofus.com/primus/?STICKER=" + dofusAccount.sessionId;
	primus = new Primus(socketURL);
	primus.on("open", () => openLoginServer(primus, dofusAccount))
	primus.on("data", payload => {
		console.log(payload._messageType);
		if (authorizedAuthMessage.includes(payload._messageType)) {
			console.log(`[${moment().format("HH:mm:ss.SSS")}] SOCKET | \u001b[34mRCV\u001b[37m \u001b[30m| ${payload._messageType}`);
			switch (payload._messageType) {
				case "ConnectionFailedMessage": ConnectionFailedMessage(primus, payload);
					break;
				case "HelloConnectMessage": HelloConnectMessage(primus, payload, dofusAccount);
					break;
				case "ServersListMessage": ServersListMessage(primus, payload);
					break;
				case "SelectedServerRefusedMessage": SelectedServerRefusedMessage(primus, payload);
					break;
				case "SelectedServerDataMessage": SelectedServerDataMessage(primus, payload, dofusAccount);
					break;
			}
		}
	})
	primus.on("reconnected", () => console.log("reconnected"))
	primus.on("error", error => console.log(error))
	primus.on("end", () => {})
	primus.open();
}
/* Authentication */
function openLoginServer(primus, dofusAccount) {
	send(primus, "connecting", {language: "fr", server: "login", client: "android", appVersion: dofusAccount.appVersion, buildVersion: dofusAccount.buildVersion});
}
function ConnectionFailedMessage(primus, payload) {
	console.log(`Echec de connexion ${payload.reason}`);
}
function HelloConnectMessage(primus, payload, dofusAccount) {
	send(primus, "login", {key: payload.key, salt: payload.salt, token: dofusAccount.token, username: dofusAccount.username});
}
function ServersListMessage(primus, payload) {
	var servers = payload.servers.filter(s => s.charactersCount > 0);
	var server = servers[0];
	sendMessage(primus, "ServerSelectionMessage", {serverId: server.id});
}
async function SelectedServerRefusedMessage(primus, payload) {
	if (payload.serverStatus === 4) {
		console.log("Serveur en maintenance");
	} else {
		console.log(payload);
		console.log("SelectedServerRefusedMessage");
	}
}
function SelectedServerDataMessage(primus, payload, dofusAccount) {
	dofusAccount.ticket = payload.ticket;
	dofusAccount.server = {
		address: payload.address,
		port: payload.port,
		id: payload.serverId
	}
	send(primus, "disconnecting", "SWITCHING_TO_GAME");
	const webSocketRequestModel = new WebSocketRequestModel();
	connectionToGameServer(webSocketRequestModel, dofusAccount);
}
const authorizedGameMessage = [
	"HelloGameMessage",
	"TrustStatusMessage",
	"CharactersListMessage",
	"CharacterSelectedSuccessMessage",
	"CurrentMapMessage",
	"MapComplementaryInformationsDataMessage",
	"BasicNoOperationMessage",
	"BasicAckMessage",
	"SequenceNumberRequestMessage",
	"BasicLatencyStatsRequestMessage",
	"GameEntitiesDispositionMessage",
	"SequenceEndMessage",
	"GameFightTurnReadyRequestMessage",
	"GameFightTurnStartMessage",
	"GameActionFightSpellCastMessage",
	"GameActionFightNoSpellCastMessage",
	"GameMapMovementMessage",
	"GameActionFightDeathMessage",
	"GameFightEndMessage",
	"CharacterSelectedForceMessage",
	"FighterStatsListMessage",
	"CharacterStatsListMessage",
	"GameFightPlacementPossiblePositionsMessage"
];
function connectionToGameServer(webSocketRequestModel, dofusAccount) {
	const socketURL = "https://proxyconnection.touch.dofus.com/primus/?STICKER=" + dofusAccount.sessionId;
	primus = new Primus(socketURL);
	primus.on("open", () => openGameServer(primus, dofusAccount))
	primus.on("data", payload => {
		if (authorizedGameMessage.includes(payload._messageType)) {
			console.log(`[${moment().format("HH:mm:ss.SSS")}] SOCKET | \u001b[34mRCV\u001b[37m \u001b[30m| ${payload._messageType}`);
			switch (payload._messageType) {
				case "HelloGameMessage": HelloGameMessage(primus, payload, dofusAccount);
					break;
				case "TrustStatusMessage": TrustStatusMessage(primus, payload);
					break;
				case "CharactersListMessage": CharactersListMessage(primus, payload);
					break;
				case "CharacterSelectedSuccessMessage": CharacterSelectedSuccessMessage(primus, payload, dofusAccount);
					break;
				case "CurrentMapMessage": CurrentMapMessage(primus, payload, dofusAccount);
					break;
				case "MapComplementaryInformationsDataMessage": MapComplementaryInformationsDataMessage(primus, payload, dofusAccount);
					break;
				case "BasicNoOperationMessage": BasicNoOperationMessage(primus, payload, dofusAccount);
					break;
				case "BasicAckMessage": BasicAckMessage(primus, payload, dofusAccount);
					break;
				case "SequenceNumberRequestMessage": SequenceNumberRequestMessage(primus, payload);
					break;
				case "BasicLatencyStatsRequestMessage": BasicLatencyStatsRequestMessage(primus, payload);
					break;
				case "GameEntitiesDispositionMessage": GameEntitiesDispositionMessage(primus, payload, dofusAccount);
					break;
				case "SequenceEndMessage": SequenceEndMessage(primus, payload, dofusAccount);
					break;
				case "GameFightTurnReadyRequestMessage": GameFightTurnReadyRequestMessage(primus, payload);
					break;
				case "GameFightTurnStartMessage": GameFightTurnStartMessage(primus, payload, dofusAccount);
					break;
				case "GameActionFightSpellCastMessage": GameActionFightSpellCastMessage(primus, payload, dofusAccount);
					break;
				case "GameActionFightNoSpellCastMessage": GameActionFightNoSpellCastMessage(primus, payload);
					break;
				case "GameMapMovementMessage": GameMapMovementMessage(primus, payload, dofusAccount);
					break;
				case "GameActionFightDeathMessage": GameActionFightDeathMessage(primus, payload, dofusAccount);
					break;
				case "GameFightEndMessage": GameFightEndMessage(primus, payload);
					break;
				case "CharacterSelectedForceMessage": CharacterSelectedForceMessage(primus, payload, dofusAccount);
					break;
				case "FighterStatsListMessage": FighterStatsListMessage(primus, payload, dofusAccount);
					break;
				case "CharacterStatsListMessage": CharacterStatsListMessage(primus, payload, dofusAccount);
					break;
				case "GameFightPlacementPossiblePositionsMessage": GameFightPlacementPossiblePositionsMessage(primus, payload, dofusAccount);
					break;
			}
		}
	})
	primus.on("reconnected", () => console.log("reconnected"))
	primus.on("error", error => console.log(error))
	primus.on("end", () => {})
	primus.open();
}
/* Game */
function openGameServer(primus, dofusAccount) {
	send(primus, "connecting", {language: "fr", server: dofusAccount.server, client: "android", appVersion: dofusAccount.appVersion, buildVersion: dofusAccount.buildVersion});
}
function HelloGameMessage(primus, payload, dofusAccount) {
	sendMessage(primus, "AuthenticationTicketMessage", {ticket: dofusAccount.ticket, lang: "fr"});
}
function TrustStatusMessage(primus, payload) {
	sendMessage(primus, "CharactersListRequestMessage", {type: "CharactersListRequestMessage"})
}
function CharactersListMessage(primus, payload) {
	sendMessage(primus, "CharacterFirstSelectionMessage", {id: payload.characters[0].id, doTutorial: false})
}
function CharacterSelectedSuccessMessage(primus, payload, dofusAccount) {
	dofusAccount.characterId = payload.infos.id;
	dofusAccount.level = payload.infos.level;
	dofusAccount.characterName = payload.infos.name;
	sendMessage(primus, "GameContextCreateRequestMessage");
}
async function CurrentMapMessage(primus, payload, dofusAccount) {
	dofusAccount.mapId = payload.mapId;
	dofusAccount.mapCoord = await MapService.resolveMapPosition(payload.mapId);
	dofusAccount.map = await MapService.resolveMap(payload.mapId);
	sendMessage(primus, "MapInformationsRequestMessage", {mapId:dofusAccount.mapId})
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
const authorizedMaps = ["-1,-14", "0,-14"];
const authorizedMoveMaps = ["-1,-14"];
const authorizedFightMaps = ["0,-14"];

async function MapComplementaryInformationsDataMessage(primus, payload, dofusAccount) {
	console.log(dofusAccount.mapCoord);
	if (nbFightDone === nbFightToDo) {
		return;
	}
	if (authorizedMaps.includes(dofusAccount.mapCoord)) {
		const character = payload.actors.find((a) => a.contextualId === dofusAccount.characterId);
		if (character) {
			dofusAccount.characterCellId = character.disposition.cellId;
		}
		if (authorizedMoveMaps.includes(dofusAccount.mapCoord)) {
			// set move packets for current map coord
			setMovePacketsforCurrentCoord(dofusAccount);
		}
		if (authorizedFightMaps.includes(dofusAccount.mapCoord) && !gameFightStarted) {
			const monsters = payload.actors.filter(actor => actor.contextualId < 0 && !actor.npcId);
			for (let monster of monsters) {
				console.log(`${monster.staticInfos.mainCreatureLightInfos.staticInfos.nameId}, ${monster.staticInfos.underlings.length + 1} Monster(s) id:${monster.contextualId}`);
			}
			dofusAccount.groupMonsters = monsters.filter(monster => monster.staticInfos.underlings.length >= MIN_MONSTER - 1 && monster.staticInfos.underlings.length <= MAX_MONSTER - 1);
			console.log(`${dofusAccount.groupMonsters.length} groupes éligible(s)`);
			// set fight packets for current map coord
			setFightPacketsforCurrentCoord(dofusAccount);
		}
	} else {
		console.log(`${dofusAccount.mapCoord} n'est pas compris dans le cas de vérification`);
	}
}
async function BasicNoOperationMessage(primus, payload, dofusAccount) {
	if (nbFightDone === nbFightToDo) {
		console.log("Well Done !");
		send(primus, "disconnecting", "CLIENT_CLOSING");
		return;
	}
	// Move
	if (readyForChangeMapMessage) {
		readyForChangeMapMessage = false;
		var packet = packetsToSend.shift();
		sendMessage(primus, packet.call, packet.data);
	}
	if (readyForGameMapMovementConfirmMessage) {
		readyForGameMapMovementConfirmMessage = false;
		var packet = packetsToSend.shift();
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
		var packet = packetsToSend.shift();
		sendMessage(primus, packet.call, packet.data);
		packetsToSend.push({
			type: "sendMessage",
			call: "GameMapMovementConfirmMessage",
			data: null
		});
		readyForGameMapMovementConfirmMessage = true;
	}
	// Fight
	if (readyForGameRolePlayAttackMonsterRequestMessage) {
		readyForGameRolePlayAttackMonsterRequestMessage = false;
		var packet = packetsToSend.shift();
		sendMessage(primus, packet.call, packet.data);
	}
	if (readyForGameMapMovementFightConfirmMessage) {
		readyForGameMapMovementFightConfirmMessage = false;
		var packet = packetsToSend.shift();
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
		var packet = packetsToSend.shift();
		sendMessage(primus, packet.call, packet.data);
		packetsToSend.push({
			type: "sendMessage",
			call: "GameMapMovementConfirmMessage",
			data: null
		});
		readyForGameMapMovementFightConfirmMessage = true;
	}

	// During fight
	if (readyForGameFightTurn) {
		readyForGameFightTurn = false;
		FigthService.resolveDistanceFrom(dofusAccount.monstersInFight, dofusAccount.characterCellId);
		FigthService.orderByDistanceAsc(dofusAccount.monstersInFight);
		var rowPair = Math.floor(dofusAccount.characterCellId/14) % 2 === 0;
		if (rowPair && 
			(
				(dofusAccount.monstersInFight[0].x === -1 && dofusAccount.monstersInFight[0].y === -1)
				|| (dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === -1)
				|| (dofusAccount.monstersInFight[0].x === -1 && dofusAccount.monstersInFight[0].y === 1)
				|| (dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === 1)
			) || !rowPair && 
			(
				(dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === -1)
				|| (dofusAccount.monstersInFight[0].x === 1 && dofusAccount.monstersInFight[0].y === -1)
				|| (dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === 1)
				|| (dofusAccount.monstersInFight[0].x === 1 && dofusAccount.monstersInFight[0].y === 1)
			)
		) {
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
}
async function BasicAckMessage(primus, payload, dofusAccount) {
}
function SequenceNumberRequestMessage(primus, payload) {
	sequenceNumber += 1;
	sendMessage(primus, "SequenceNumberMessage", {
		number: sequenceNumber
	})
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
	sendMessage(primus, "GameActionAcknowledgementMessage", {valid: true, actionId: dofusAccount.acknowledgementActionId});
	if (payload.authorId === dofusAccount.characterId) {
		sendMessage(primus, "GameFightTurnFinishMessage");
	}
}
async function GameEntitiesDispositionMessage(primus, payload, dofusAccount) {
	if (!gameFightStarted) {
		gameFightStarted = true;
		await new Promise(resolve => setTimeout(resolve, 10000))
		sendMessage(primus, "GameFightReadyMessage", {isReady: true});
	}
	const character = payload.dispositions.find(disposition => disposition.id === dofusAccount.characterId);
	if (character) {
		dofusAccount.characterCellId = character.cellId;
	}
	dofusAccount.playersInFight = payload.dispositions.filter(disposition => disposition.id !== dofusAccount.characterId && disposition.id > 0);
	dofusAccount.monstersInFight = payload.dispositions.filter(disposition => disposition.id !== dofusAccount.characterId && disposition.id < 0);
	if (dofusAccount.monstersInFight.length) {
		readyForGameFightPlacementPositionRequestMessage = true;
	}
}
function GameFightTurnReadyRequestMessage(primus, payload) {
	sendMessage(primus, "GameFightTurnReadyMessage", {isReady: true});
}
async function GameFightTurnStartMessage(primus, payload, dofusAccount) {
	sendMessage(primus, "GameActionAcknowledgementMessage", {valid: true});
	if (payload.id === dofusAccount.characterId) {
		console.log(`Début de tour, Je suis sur la cellId ${dofusAccount.characterCellId}`);
		readyForGameFightTurn = true;
	}
}
async function GameActionFightSpellCastMessage(primus, payload, dofusAccount) {
	if (payload.sourceId === dofusAccount.characterId) {
		console.log(`Le sort ${SPELL_ID}  à été lancé`);
		gameAction(primus, dofusAccount);
	}
}
function GameActionFightNoSpellCastMessage(primus, payload) {
}
async function GameMapMovementMessage(primus, payload, dofusAccount) {
	if (gameFightStarted && dofusAccount.characterId === payload.actorId) {
		dofusAccount.characterCellId = payload.keyMovements[payload.keyMovements.length - 1];
		gameMove(primus, dofusAccount);
	} else if (gameFightStarted) {
		const player = dofusAccount.playersInFight.find(player => player.id === payload.actorId);
		if (player) player.cellId = payload.keyMovements[payload.keyMovements.length - 1];
		const monster = dofusAccount.monstersInFight.find(monster => monster.id === payload.actorId);
		if (monster) monster.cellId = payload.keyMovements[payload.keyMovements.length - 1];
	}
}
function GameActionFightDeathMessage(primus, payload, dofusAccount) {
	console.log(`${payload.targetId} is Death :)`);
	dofusAccount.monstersInFight = dofusAccount.monstersInFight.filter(monster => monster.id !== payload.targetId);
}
function GameFightEndMessage(primus, payload) {
	console.log(`Combat terminé en ${Math.ceil(payload.duration/1000)} secondes.`)
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
	dofusAccount.positionsForChallengers = payload.positionsForChallengers.map(position => new Object({cellId: position}));
}
async function setMovePacketsforCurrentCoord(dofusAccount) {
	await PathFindingService.constructMapPoints();
	await PathFindingService.initGrid();
	await PathFindingService.fillPathGrid(dofusAccount.map);
	switch (dofusAccount.mapCoord) {
		case "-1,-14":
			dofusAccount.dir = "left";
			break;
	}
	dofusAccount.targetCellId = await PathFindingService.getRandomCellId(dofusAccount);
	dofusAccount.newMapId = await MapService.resolveNewMapId(dofusAccount.map, dofusAccount.dir);
	dofusAccount.keyMovements = await PathFindingService.getPath(dofusAccount.characterCellId, dofusAccount.targetCellId, dofusAccount.occupiedCells, true, false);
	packetsToSend.push({
		type: "sendMessage",
		call: "GameMapMovementRequestMessage",
		data: {
			keyMovements:PathFindingService.compressPath(dofusAccount.keyMovements), 
			mapId:dofusAccount.mapId
		}
	});
	readyForGameMapMovementRequestMessage = true;
}
async function setFightPacketsforCurrentCoord(dofusAccount) {
	if (dofusAccount.groupMonsters.length) {
		await PathFindingService.constructMapPoints();
		await PathFindingService.initGrid();
		await PathFindingService.fillPathGrid(dofusAccount.map);

		const groupToAttack = dofusAccount.groupMonsters[0];
		console.log(`Attaque ${groupToAttack.staticInfos.mainCreatureLightInfos.staticInfos.nameId}, ${groupToAttack.staticInfos.underlings.length + 1} Monster(s) id:${groupToAttack.contextualId}`);
		dofusAccount.monsterNumber = groupToAttack.staticInfos.underlings.length + 1;

		dofusAccount.monsterToAttackCellId = groupToAttack.disposition.cellId;
		dofusAccount.monsterGroupId = groupToAttack.contextualId;

		console.log('Je suis sur la cellId', dofusAccount.characterCellId);
		console.log('Le monstre est sur la cellId', dofusAccount.monsterToAttackCellId);

		if (dofusAccount.characterCellId !== dofusAccount.monsterToAttackCellId) {
			dofusAccount.keyMovements = await PathFindingService.getPath(dofusAccount.characterCellId, dofusAccount.monsterToAttackCellId, dofusAccount.occupiedCells, true, false);
			packetsToSend.push({
				type: "sendMessage",
				call: "GameMapMovementRequestMessage",
				data: {
					keyMovements:PathFindingService.compressPath(dofusAccount.keyMovements), 
					mapId:dofusAccount.mapId
				}
			});
			readyForGameMapMovementFightRequestMessage = true;
		} else {
			packetsToSend.push({
				type: "sendMessage",
				call: "GameRolePlayAttackMonsterRequestMessage",
				data: {
					monsterGroupId: dofusAccount.monsterGroupId
				}
			});
			readyForGameRolePlayAttackMonsterRequestMessage = true;
		}
	}
}
async function gameAction(primus, dofusAccount) {
	console.log(`gameAction ${dofusAccount.currentPA} PA`);
	if (dofusAccount.currentPA < 4) {
		console.log("plus de PA dispo, fin de tour");
		dofusAccount.setPA(6);
		dofusAccount.setPM(3);
		sendMessage(primus, "GameFightTurnFinishMessage");
		return;
	}
	var rowPair = Math.floor(dofusAccount.characterCellId/14) % 2 === 0;
	if (
		rowPair && 
		(
			(dofusAccount.monstersInFight[0].x === -1 && dofusAccount.monstersInFight[0].y === -1)
			|| (dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === -1)
			|| (dofusAccount.monstersInFight[0].x === -1 && dofusAccount.monstersInFight[0].y === 1)
			|| (dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === 1)
		) || !rowPair && 
		(
			(dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === -1)
			|| (dofusAccount.monstersInFight[0].x === 1 && dofusAccount.monstersInFight[0].y === -1)
			|| (dofusAccount.monstersInFight[0].x === 0 && dofusAccount.monstersInFight[0].y === 1)
			|| (dofusAccount.monstersInFight[0].x === 1 && dofusAccount.monstersInFight[0].y === 1)
		)
	) {
		sendMessage(primus, "GameActionFightCastRequestMessage", {spellId: SPELL_ID, cellId: dofusAccount.characterCellId});
		dofusAccount.removePA(4);
	} else {
		sendMessage(primus, "GameFightTurnFinishMessage");
	}
}
async function gameMove(primus, dofusAccount) {
	console.log(`gameMove ${dofusAccount.currentPM} PM`);
	if (dofusAccount.currentPM === 0) {
		console.log("plus de PM dispo, on essaye d'attaquer");
		gameAction(primus, dofusAccount);
	} else {
		console.log("Je me déplace de 1pm");
		var rowPair = Math.floor(dofusAccount.characterCellId/14) % 2 === 0;
		dofusAccount.availableCellsToMove = FigthService.getAvailableCellsToMove(rowPair, dofusAccount);
		for (var player in dofusAccount.playersInFight) {
			dofusAccount.availableCellsToMove = dofusAccount.availableCellsToMove.filter(cell => cell.cellId !== player.cellId)
		}
		for (var monster in dofusAccount.monstersInFight) {
			dofusAccount.availableCellsToMove = dofusAccount.availableCellsToMove.filter(cell => cell.cellId !== monster.cellId)
		}
		FigthService.resolveDistanceFrom(dofusAccount.availableCellsToMove, dofusAccount.monstersInFight[0].cellId);
		FigthService.orderByDistanceAsc(dofusAccount.availableCellsToMove);
		await PathFindingService.constructMapPoints();
		await PathFindingService.initGrid();
		await PathFindingService.fillPathGrid(dofusAccount.map);
		dofusAccount.keyMovements = await PathFindingService.getPath(dofusAccount.characterCellId, dofusAccount.availableCellsToMove[0].cellId, dofusAccount.occupiedCells, false, false);
		sendMessage(primus, "GameMapMovementRequestMessage", {keyMovements:dofusAccount.keyMovements, mapId:dofusAccount.mapId});
		dofusAccount.removePM(1);
	}
}
