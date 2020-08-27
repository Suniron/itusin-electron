"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _primusService = require("../../services/primus.service.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ProtocoleAuth =
/*#__PURE__*/
function () {
  function ProtocoleAuth() {
    _classCallCheck(this, ProtocoleAuth);
  }

  _createClass(ProtocoleAuth, [{
    key: "HelloConnectMessage",
    value: function HelloConnectMessage(dofusAccount, payload) {
      (0, _primusService.send)(dofusAccount.primus, "login", {
        key: payload.key,
        salt: payload.salt,
        token: dofusAccount.token,
        username: dofusAccount.username
      });
    }
  }, {
    key: "HelloConnectMessageWorld",
    value: function HelloConnectMessageWorld(dofusAccount, payload) {
      (0, _primusService.sendMessage)(primus, "AuthenticationTicketMessage", {
        ticket: dofusAccount.ticket,
        lang: "fr"
      });
    }
  }, {
    key: "openLoginServer",
    value: function openLoginServer(dofusAccount) {
      (0, _primusService.send)(dofusAccount.primus, "connecting", {
        language: "fr",
        server: "login",
        client: "android",
        appVersion: dofusAccount.appVersion,
        buildVersion: dofusAccount.buildVersion
      });
    }
  }, {
    key: "ServersListMessage",
    value: function ServersListMessage(dofusAccount, payload) {
      var servers = payload.servers.filter(function (s) {
        return s.charactersCount > 0;
      });
      var server = servers[0];
      (0, _primusService.sendMessage)(dofusAccount.primus, "ServerSelectionMessage", {
        serverId: server.id
      });
    }
  }, {
    key: "SelectedServerDataMessage",
    value: function SelectedServerDataMessage(dofusAccount, payload) {
      dofusAccount.ticket = payload.ticket;
      dofusAccount.server = {
        address: payload.address,
        port: payload.port,
        id: payload.serverId
      };
      (0, _primusService.send)(dofusAccount.primus, "disconnecting", "SWITCHING_TO_GAME");
    }
  }]);

  return ProtocoleAuth;
}();

exports["default"] = ProtocoleAuth;