"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require("events"),
    EventEmitter = _require.EventEmitter;

var Script = require("./script");

var Primus = require("../../src/libs/primus.js");

module.exports =
/*#__PURE__*/
function () {
  function DofusAccount() {
    var username = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    var password = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
    var proxyUsername = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
    var proxyPassword = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
    var proxyHost = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "";
    var proxyPort = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : "";

    _classCallCheck(this, DofusAccount);

    this.proxy = proxyUsername.length && proxyPassword.length && proxyHost.length && proxyPort.length ? "http://" + proxyUsername + ":" + proxyPassword + "@" + proxyHost + ":" + proxyPort : proxyHost.length && proxyPort.length ? "http://" + proxyHost + ":" + proxyPort : "";
    this.appVersion = "";
    this.buildVersion = "";
    this.token = "";
    this.sessionId = "";
    this.world = false;
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
    this.primus = new Primus();
  }

  _createClass(DofusAccount, [{
    key: "setPA",
    value: function setPA(value) {
      this.currentPA = value;
    }
  }, {
    key: "removePA",
    value: function removePA(value) {
      console.log("removePA");
      this.currentPA = this.currentPA - value;
    }
  }, {
    key: "setPM",
    value: function setPM(value) {
      this.currentPM = value;
    }
  }, {
    key: "removePM",
    value: function removePM(value) {
      console.log("removePM");
      this.currentPM = this.currentPM - value;
    }
  }, {
    key: "setPrimus",
    value: function setPrimus(value) {
      this.primus = value;
    }
  }]);

  return DofusAccount;
}();