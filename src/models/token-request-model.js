module.exports = class TokenRequestModel {
    constructor(haapiKey, haapiId, proxy = "") {
        this.haapiKey = haapiKey;
        this.haapiId = haapiId;
        this.proxy = proxy;
    }
}