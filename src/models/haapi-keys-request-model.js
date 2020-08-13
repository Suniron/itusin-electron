module.exports = class HaapiKeysRequestModel {
    constructor(username, password, proxy = "") {        
        this.username = username;
        this.password = password;
        this.proxy = proxy;
    }
}