require('dotenv').config();

/* Electron */
var ipc = require('electron').ipcRenderer;

/* Libs */
var { uniqueNamesGenerator, adjectives, animals } = require("unique-names-generator");
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

var quit = () => ipc.send('quit');

window.addEventListener("DOMContentLoaded", async (event) => {
	console.log("Demande de connexion...");

	await MapService.initialize();

	const dofusAccount = new DofusAccount(process.env.DOFUS_USERNAME, process.env.DOFUS_PASSWORD);

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
	data = data !== null ? { type: type, data: data} : {type: type};
	send(primus, "sendMessage", data);
}

function connectionToAuthServer(webSocketRequestModel, dofusAccount) {
	const socketURL = "https://proxyconnection.touch.dofus.com/primus/?STICKER=" + dofusAccount.sessionId;
	primus = new Primus(socketURL);
	primus.on("open", () => openLoginServer(primus, dofusAccount))
	primus.on("data", payload => {
		console.log(`[${moment().format("HH:mm:ss.SSS")}] SOCKET | \u001b[34mRCV\u001b[37m \u001b[30m| ${payload._messageType}`);
		switch (payload._messageType) {
			case "ConnectionFailedMessage": ConnectionFailedMessage(primus, payload);
				break;
			case "HelloConnectMessage": HelloConnectMessage(primus, payload, dofusAccount);
				break;
			case "NicknameRegistrationMessage": NicknameRegistrationMessage(primus, payload, dofusAccount);
				break;
			case "NicknameRefusedMessage": NicknameRefusedMessage(primus, payload, dofusAccount);
				break;
			case "NicknameAcceptedMessage": NicknameAcceptedMessage(primus, payload, dofusAccount);
				break;				
			case "ServersListMessage": ServersListMessage(primus, payload);
				break;
			case "SelectedServerRefusedMessage": SelectedServerRefusedMessage(primus, payload);
				break;
			case "SelectedServerDataMessage": SelectedServerDataMessage(primus, payload, dofusAccount);
				break;
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
function NicknameRegistrationMessage(primus, payload, dofusAccount) {
	const nickname = Math.random().toString(36).substring(2,16);
	sendMessage(primus, "NicknameChoiceRequestMessage", {nickname: nickname});
}
function NicknameRefusedMessage(primus, payload, dofusAccount) {
	const nickname = Math.random().toString(36).substring(2,16);
	sendMessage(primus, "NicknameChoiceRequestMessage", {nickname: nickname});
}
async function NicknameAcceptedMessage(primus, payload, dofusAccount) {
	console.log("Pseudo enregistré avec succès");
	send(primus, "disconnecting", "CLIENT_CLOSING");
	await new Promise(resolve => setTimeout(resolve, 1000));
	send(primus, "connecting", {language: "fr", server: "login", client: "android", appVersion: dofusAccount.appVersion, buildVersion: dofusAccount.buildVersion});
}
function ServersListMessage(primus, payload) {
	var isEmpty = payload.servers.every(server => server.charactersCount === 0);
	if (isEmpty) {
		sendMessage(primus, "ServerSelectionMessage", {serverId: 404}); // Terra Cogita
	} else {
		var servers = payload.servers.filter(s => s.charactersCount > 0);
		var server = servers[0];
		sendMessage(primus, "ServerSelectionMessage", {serverId: server.id});
	}
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

function connectionToGameServer(webSocketRequestModel, dofusAccount) {
	const socketURL = "https://proxyconnection.touch.dofus.com/primus/?STICKER=" + dofusAccount.sessionId;
	primus = new Primus(socketURL);
	primus.on("open", () => openGameServer(primus, dofusAccount))
	primus.on("data", payload => {
		console.log(`[${moment().format("HH:mm:ss.SSS")}] SOCKET | \u001b[34mRCV\u001b[37m \u001b[30m| ${payload._messageType}`);
		switch (payload._messageType) {
			case "HelloGameMessage": HelloGameMessage(primus, payload, dofusAccount);
				break;
			case "TrustStatusMessage": TrustStatusMessage(primus, payload);
				break;
			case "CharactersListMessage": CharactersListMessage(primus, payload, dofusAccount);
				break;
			case "CharacterCreationResultMessage": CharacterCreationResultMessage(primus, payload, dofusAccount);
				break;
			case "CharacterSelectedSuccessMessage": CharacterSelectedSuccessMessage(primus, payload, dofusAccount);
				break;
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
	if (payload.characters.length) {
		sendMessage(primus, "CharacterFirstSelectionMessage", {id: payload.characters[0].id, doTutorial: false})
	} else {
		characterCreationRequestMessage(primus);
	}
}
function CharacterCreationResultMessage(primus, payload) {
	if (payload.result === 0) {
		console.log("Création de personnage réussie");
	} else if (payload.result === 3) {
		console.log("Erreur pendant la création de personnage");
		characterCreationRequestMessage(primus);
	}
}
function CharacterSelectedSuccessMessage(primus, payload, dofusAccount) {
	dofusAccount.level = payload.infos.level;
	dofusAccount.characterName = payload.infos.name;
	console.log(`Sélection du personnage ${dofusAccount.characterName} (Niveau ${dofusAccount.level})`);
}

function characterCreationRequestMessage(primus) {
	var start = uniqueNamesGenerator({dictionaries: [adjectives], length: 1});
	var end = uniqueNamesGenerator({dictionaries: [animals], length: 1});
	var nickname = start.substring(0,1).toUpperCase() + start.substring(1).toLowerCase() + '-' + end.substring(0,1).toUpperCase() + end.substring(1).toLowerCase();
	console.log(nickname)
	sendMessage(primus, "CharacterCreationRequestMessage", {
		'name':nickname,
		'breed':2, // osa
		'sex':false, // true: female, false: male
		'colors':[32750686, 50331598, 55168221, 69935891, 100647984],
		'cosmeticId': 17
	});
}