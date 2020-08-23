var { EventEmitter } = require("events");
var Script = require("./script");

module.exports = class DofusAccount {
    constructor(username = "", password = "", proxyUsername = "", proxyPassword = "", proxyHost = "", proxyPort = "") {
		this.proxy = proxyUsername.length && proxyPassword.length && proxyHost.length && proxyPort.length ? "http://" + proxyUsername + ":" + proxyPassword + "@" + proxyHost + ":" + proxyPort : proxyHost.length && proxyPort.length ? "http://" + proxyHost + ":" + proxyPort : "";
		
		this.appVersion = "";
		this.buildVersion = "";

		this.token = "";
		this.sessionId = "";

		this.connected = false;
		this.importScriptReady = false;
		this.startScriptReady = false;

		/* Stats */
		this.experienceLevelFloor = 0;
		this.experienceNextLevelFloor = 0;
		this.experienceProgress = 0;
        this.level = 0;
        this.lifePoints = 0;
		this.maxLifePoints = 0;
		this.lifePercent = 0;
        this.energyPoints = 0;
		this.maxEnergyPoints = 0;
		this.energyPercent = 0;
        this.weight = 0;
		this.weightMax = 0;
		this.weightPercent = 0;
        this.kamas = 0;
		this.mapCoord = 0;
		
		/* Script */
		this.map = {};
		this.script = new Script();
		this.scriptRunning = false;

		/* Movements */
		this.dir = "";
		this.characterCellId = -1;
		this.targetCellId = -1;
		this.newMapId = -1;
		this.occupiedCells = [];
		this.keyMovements = [];
		this.timeout = 0;

		/* Fight Outside*/
		this.groupMonsters = [];
		this.monsterToAttackCellId = 0;
		this.monsterGroupId = 0;
		this.monsterNumber = 0;

		/* Fight inside */

		this.positionsForChallengers = [];

		this.currentPA = 6;
		this.currentPM = 3;
		this.currentPO = 1;

		this.playersInFight = [];
		this.monstersInFight = [];
		this.monstersICanAttack = [];
		this.acknowledgementActionId = 0;

		this.availableCellsToMove = [];

		/* Other */
		this.emitter = new EventEmitter();
		this.username = username;
		this.password = password;
		this.proxyUsername = proxyUsername;
		this.proxyPassword = proxyPassword;
		this.proxyHost = proxyHost;
		this.proxyPort = proxyPort;
		this.server = "login";
		this.ip = "";
		
		this.isFighting = false;
		this.monsterPositions = [];
		this.npcPositions = [];

		this.isMoving = false;
		this.isMovingCounter = 0;
		this.experienceCharacter = 0;
		this.level = 0;
		this.spellId = 161;
		this.cellIdforSpell = 0;
		this.acknowledgementActionId = 0;
		this.readyForFight = false;
		this.nbInvocations = 0;

	}
	
	setPA(value) {
		this.currentPA = value;
	}

	removePA(value) {
		console.log("removePA");
		this.currentPA = this.currentPA - value;
	}

	setPM(value) {
		this.currentPM = value;
	}

	removePM(value) {
		console.log("removePM");
		this.currentPM = this.currentPM - value;
	}
}
