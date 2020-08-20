/* Libs */
var Primus = require("../../src/libs/primus.js");
var moment = require("moment");

/* Services */
var ContextService = require("../../src/services/context.service");
var ConnectionService = require("../../src/services/connection.service");
var MapService = require("../../src/services/map.service");
var PathFindingService = require("../../src/services/pathfinding.service");
var FigthService = require("../");

/* Models */
var DofusAccount = require("../../src/models/dofus-account");
var HaapiKeysRequestModel = require("../../src/models/haapi-keys-request-model");
var ApiIdRequestModel = require("../../src/models/api-id-request-model");
var TokenRequestModel = require("../../src/models/token-request-model");
var WebSocketRequestModel = require("../../src/models/web-socket-request-model");

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
	"GameFightTurnStartMessage"
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
	console.log(`Sélection du personnage ${dofusAccount.characterName} (Niveau ${dofusAccount.level})`);
	sendMessage(primus, "GameContextCreateRequestMessage");
}
async function CurrentMapMessage(primus, payload, dofusAccount) {
	dofusAccount.mapId = payload.mapId;
	dofusAccount.mapCoord = await MapService.resolveMapPosition(payload.mapId);
	dofusAccount.map = await MapService.resolveMap(payload.mapId);
	sendMessage(primus, "MapInformationsRequestMessage", {mapId:dofusAccount.mapId})
}

var sequenceNumber = 0;
var nbFightDone = 0;
var nbFightToDo = 1;
var isFinished = false;

const authorizedMaps = ["2,0"];

var readyForGameFight = false;
var gameFightStarted = false;


var readyForGameMapMovementConfirm = false;
var readyForGameMapChange = false;

var MIN_MONSTER = 1;
var MAX_MONSTER = 8;

async function MapComplementaryInformationsDataMessage(primus, payload, dofusAccount) {
	if (authorizedMaps.includes(dofusAccount.mapCoord)) {
		if (nbFightDone === nbFightToDo) {
			isFinished = true;
			return;
		}
		//nbFightDone++;
		const character = payload.actors.find((a) => a.contextualId === dofusAccount.characterId);
		if (character) {
			dofusAccount.characterCellId = character.disposition.cellId;
		}
		const monsters = payload.actors.filter(actor => actor.contextualId < 0 && !actor.npcId);
		for (let monster of monsters) {
			console.log(`${monster.staticInfos.mainCreatureLightInfos.staticInfos.nameId}, ${monster.staticInfos.underlings.length + 1} Monster(s) id:${monster.contextualId}`);
		}
		dofusAccount.groupMonsters = monsters.filter(monster => monster.staticInfos.underlings.length >= MIN_MONSTER - 1 && monster.staticInfos.underlings.length <= MAX_MONSTER - 1);
		console.log(`${dofusAccount.groupMonsters.length} groupes éligible(s)`);
		readyForGameFight = true;
	} else {
		console.log(`${dofusAccount.mapCoord} n'est pas compris dans le cas de vérification`);
	}
}
async function BasicNoOperationMessage(primus, payload, dofusAccount) {
	if (isFinished) {
		console.log("Well Done !")
	}
	if (readyForGameFight) {
		readyForGameFight = false;
		if (dofusAccount.groupMonsters.length) {
			const groupToAttack = dofusAccount.groupMonsters[0];
			console.log(`Attaque ${groupToAttack.staticInfos.mainCreatureLightInfos.staticInfos.nameId}, ${groupToAttack.staticInfos.underlings.length + 1} Monster(s) id:${groupToAttack.contextualId}`);
		
			dofusAccount.monsterToAttackCellId = groupToAttack.disposition.cellId;
			dofusAccount.monsterGroupId = groupToAttack.contextualId;

			await PathFindingService.constructMapPoints();
			await PathFindingService.initGrid();
			await PathFindingService.fillPathGrid(dofusAccount.map);
			console.log('Je suis sur la cellId', dofusAccount.characterCellId);
			console.log('Le monstre est sur la cellId', dofusAccount.monsterToAttackCellId);

			dofusAccount.keyMovements = await PathFindingService.getPath(dofusAccount.characterCellId, dofusAccount.monsterToAttackCellId, dofusAccount.occupiedCells, true, false);
			console.log(dofusAccount.keyMovements);
			if (dofusAccount.keyMovements.length > 1) {
				sendMessage(primus, "GameMapMovementRequestMessage", {keyMovements:PathFindingService.compressPath(dofusAccount.keyMovements), mapId:dofusAccount.mapId});
				//dofusAccount.timeout = await PathFindingService.computeDuraction(dofusAccount.keyMovements);
				//await new Promise(resolve => setTimeout(resolve, dofusAccount.timeout));
				sendMessage(primus, "GameMapMovementConfirmMessage", null);
			}
			//await new Promise(resolve => setTimeout(resolve, 2000));
			sendMessage(primus, "GameRolePlayAttackMonsterRequestMessage", {monsterGroupId: dofusAccount.monsterGroupId});
		}
	}
}
async function BasicAckMessage(primus, payload, dofusAccount) {
	if (readyForGameMapMovementConfirm) {
		readyForGameMapMovementConfirm = false;
		dofusAccount.timeout = await PathFindingService.computeDuraction(dofusAccount.keyMovements);
		//await new Promise(resolve => setTimeout(resolve, dofusAccount.timeout));
		sendMessage(primus, "GameMapMovementConfirmMessage");
		readyForGameMapChange = true;
	}
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
	dofusAccount.monstersInFight = payload.dispositions.filter(disposition => disposition.id !== dofusAccount.characterId && disposition.id < 0);
}
function SequenceEndMessage(primus, payload, dofusAccount) {
	dofusAccount.acknowledgementActionId = payload.actionId;
	sendMessage(primus, "GameActionAcknowledgementMessage", {valid: true, actionId: dofusAccount.acknowledgementActionId});
	if (payload.authorId === dofusAccount.characterId) {
		sendMessage(primus, "GameFightTurnFinishMessage");
	}
}
function GameFightTurnReadyRequestMessage(primus, payload) {
	sendMessage(primus, "GameFightTurnReadyMessage", {isReady: true});
}
async function GameFightTurnStartMessage(primus, payload, dofusAccount) {
	sendMessage(primus, 'GameActionAcknowledgementMessage', {valid: true});
	if (payload.id === dofusAccount.characterId) {
		console.log('Début de tour')
		console.log(`Je suis sur la cellId ${dofusAccount.characterCellId}`)
		if (dofusAccount.monstersInFight.length) {
			FigthService.resolveDistanceFrom(dofusAccount.monstersInFight, dofusAccount.characterCellId);
			FigthService.orderByDistanceAsc(dofusAccount.monstersInFight);
		}
		console.log(dofusAccount.monsterInFight)
		console.log(dofusAccount.monsterInFight[0])
		/*
		if (
			(dofusAccount.monsterInFight[0].x === -1 && dofusAccount.monsterInFight[0].y === -1)
			|| (dofusAccount.monsterInFight[0].x === 0 && dofusAccount.monsterInFight[0].y === -1)
			|| (dofusAccount.monsterInFight[0].x === 1 && dofusAccount.monsterInFight[0].y === -1)

			|| (dofusAccount.monsterInFight[0].x === -1 && dofusAccount.monsterInFight[0].y === 1)
			|| (dofusAccount.monsterInFight[0].x === 0 && dofusAccount.monsterInFight[0].y === 1)
			|| (dofusAccount.monsterInFight[0].x === 1 && dofusAccount.monsterInFight[0].y === 1)
		) {
			console.log(`Je lance le sors sur la cellId ${dofusAccount.monsterInFight[0].cellId}`);
			sendMessage(primus, 'GameActionFightCastRequestMessage', {spellId: spellId, cellId: dofusAccount.monsterInFight[0].cellId});
			await new Promise(resolve => setTimeout(resolve, 1000));
			sendMessage(primus, 'GameActionFightCastRequestMessage', {spellId: spellId, cellId: dofusAccount.monsterInFight[0].cellId});
		} else {
			sendMessage(primus, 'GameFightTurnFinishMessage');
		}

		*/
	}
}