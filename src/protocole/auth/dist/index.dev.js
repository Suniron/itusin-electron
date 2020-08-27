"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProtocoleAuthSender = exports.ProtocoleAuthReceived = void 0;

var _connectionSocketService = _interopRequireDefault(require("../../services/socket/connection.socket.service.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var connect_Protocol = new _connectionSocketService["default"]();

var ProtocoleAuthReceived =
/*#__PURE__*/
function () {
  function ProtocoleAuthReceived(value) {
    _classCallCheck(this, ProtocoleAuthReceived);

    this.account = value;
  }

  _createClass(ProtocoleAuthReceived, [{
    key: "HelloConnectMessage",
    value: function HelloConnectMessage(payload) {
      connect_Protocol.HelloConnectMessage(this.account, payload);
    }
  }, {
    key: "ServersListMessage",
    value: function ServersListMessage(payload) {
      connect_Protocol.ServersListMessage(this.account, payload);
    }
  }, {
    key: "SelectedServerDataMessage",
    value: function SelectedServerDataMessage(payload) {
      connect_Protocol.SelectedServerDataMessage(this.account, payload);
    }
  }]);

  return ProtocoleAuthReceived;
}();

exports.ProtocoleAuthReceived = ProtocoleAuthReceived;

var ProtocoleAuthSender =
/*#__PURE__*/
function () {
  function ProtocoleAuthSender(value) {
    _classCallCheck(this, ProtocoleAuthSender);

    this.account = value;
  }

  _createClass(ProtocoleAuthSender, [{
    key: "openLoginServer",
    value: function openLoginServer() {
      connect_Protocol.openLoginServer(this.account);
    }
  }]);

  return ProtocoleAuthSender;
}();

exports.ProtocoleAuthSender = ProtocoleAuthSender;