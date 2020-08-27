"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.send = send;
exports.sendMessage = sendMessage;
exports["default"] = void 0;

var _logService = _interopRequireDefault(require("../services/log.service.js"));

var _index = require("../../src/protocole/auth/index.js");

var _index2 = require("../../src/protocole/world/index.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Primus = require("../../src/libs/primus.js");

var log = new _logService["default"]();

var PrimusBotFunction =
/*#__PURE__*/
function () {
  function PrimusBotFunction(accountDofus) {
    _classCallCheck(this, PrimusBotFunction);

    this.accountBot = accountDofus;
  }

  _createClass(PrimusBotFunction, [{
    key: "connectionToAuthServer",
    value: function connectionToAuthServer(dofusAccount) {
      var socketURL = "https://proxyconnection.touch.dofus.com/primus/?STICKER=" + dofusAccount.sessionId;

      var _AuthSender = new _index.ProtocoleAuthSender(dofusAccount);

      var _Auth = new _index.ProtocoleAuthReceived(dofusAccount);

      var _AuthPacket = _index.ProtocoleAuthReceived.toString();

      dofusAccount.setPrimus(new Primus(socketURL));
      dofusAccount.primus.on("open", function () {
        if (!dofusAccount.world) {
          _AuthSender.openLoginServer();
        }
      });
      dofusAccount.primus.on("data", function (payload) {
        if (_AuthPacket.includes(payload._messageType)) {
          log.logPacket(payload._messageType);

          _Auth[payload._messageType](payload);
        }
      });
      dofusAccount.primus.on("reconnected", function () {
        return console.log("reconnected");
      });
      dofusAccount.primus.on("error", function (error) {
        return console.log(error);
      });
      dofusAccount.primus.on("end", function () {});
      dofusAccount.primus.open();
    }
  }]);

  return PrimusBotFunction;
}();

exports["default"] = PrimusBotFunction;

function send(primus, call) {
  var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  primus.write({
    call: call,
    data: data
  });
  call = call === "sendMessage" ? data.type : call;
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