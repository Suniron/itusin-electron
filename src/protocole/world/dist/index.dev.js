"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProtocoleWorldSender = exports.ProtocoleWorldReceived = void 0;

var _connectionSocketService = _interopRequireDefault(require("../../services/socket/connection.socket.service.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var connect_Protocol = new _connectionSocketService["default"]();

var ProtocoleWorldReceived =
/*#__PURE__*/
function () {
  function ProtocoleWorldReceived(value) {
    _classCallCheck(this, ProtocoleWorldReceived);

    this.account = value;
  }

  _createClass(ProtocoleWorldReceived, [{
    key: "HelloConnectMessage",
    value: function HelloConnectMessage(payload) {
      connect_Protocol.HelloConnectMessageWorld(this.account, payload);
    }
  }]);

  return ProtocoleWorldReceived;
}();

exports.ProtocoleWorldReceived = ProtocoleWorldReceived;

var ProtocoleWorldSender = function ProtocoleWorldSender(value) {
  _classCallCheck(this, ProtocoleWorldSender);

  this.account = value;
};

exports.ProtocoleWorldSender = ProtocoleWorldSender;