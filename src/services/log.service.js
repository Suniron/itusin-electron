let moment = require("moment");

export default class LogInfo{
    logPacket(namePacket){
        console.log(`[${moment().format("HH:mm:ss.SSS")}] SOCKET | \u001b[32mSND\u001b[37m \u001b[30m| ${namePacket}`);
    }
}