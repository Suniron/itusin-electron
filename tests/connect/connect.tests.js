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
	console.log("Well Done !");
	send(primus, "disconnecting", "CLIENT_CLOSING");
}
