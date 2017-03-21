"use strict";
class Atom {
    constructor(size, type, pos, seq) {
        this.size = size;
        this.type = type;
        this._seq = 0;
        this._level = 0;
        this._pos = pos;
        this._children = [];
        this._seq = seq;
    }
    includes(atom) {
        return this._pos < atom._pos && this._pos + this.size >= atom._pos + atom.size;
    }
    setParent(atom) {
        this._level = atom._level + 1;
        this._parent = atom;
        atom._children.push(this);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Atom;
//# sourceMappingURL=atom.js.map