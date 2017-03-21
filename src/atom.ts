export default class Atom {
    _seq: number = 0;
    _level: number = 0;
    _pos: number;
    _children: Atom[];
    _parent: Atom;

    constructor(public size: number, public type: string, pos: number, seq: number) {
        this._pos = pos;
        this._children = [];
        this._seq = seq;
    }

    includes(atom: Atom) {
        return this._pos < atom._pos && this._pos + this.size >= atom._pos + atom.size;
    }

    setParent(atom: Atom) {
        this._level = atom._level + 1;
        this._parent = atom;
        atom._children.push(this);
    }
}