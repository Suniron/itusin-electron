"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var moment = require("moment");

var LogInfo =
/*#__PURE__*/
function () {
  function LogInfo() {
    _classCallCheck(this, LogInfo);
  }

  _createClass(LogInfo, [{
    key: "logPacket",
    value: function logPacket(namePacket) {
      console.log("[".concat(moment().format("HH:mm:ss.SSS"), "] SOCKET | \x1B[32mSND\x1B[37m \x1B[30m| ").concat(namePacket));
    }
  }]);

  return LogInfo;
}();

exports["default"] = LogInfo;