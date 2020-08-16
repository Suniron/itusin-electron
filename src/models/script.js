module.exports = class Script {
    constructor(name = "", move = [], custom = []) {
        this.name = name;
        this.move = move;
        this.custom = custom;
    }
}