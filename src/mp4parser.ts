import stream = require('stream');
import events = require('events');

import Atom from './atom'

export default class MP4Parser extends events.EventEmitter {
    private _buffer: Buffer;
    private _offset: number = 0;
    private _streamOffset: number = 0;
    private _atoms: Array<Atom> = [];
    private _seq: number = 0;
    private _pipes: any[]; //[[string, number]]; // [[atomName, remains]]

    constructor(private _s: stream.Readable) {
        super();
    }

    start() {
        this._s.on('data', chunk => {
            let data = chunk as Buffer;

            if (!this._buffer) {
                this._buffer = data;
            }
            else {
                if (this._offset < this._buffer.length) {
                    this._streamOffset += this._offset;
                    this._buffer = Buffer.concat([this._buffer.slice(this._offset), data]);
                    this._offset = 0;
                }
                else {
                    this._offset -= this._buffer.length;
                    this._streamOffset += this._buffer.length;
                    this._buffer = data;
                }
            }

            this._triggerPipe();
            this._readAtom();
        });

        this._s.on('close', () => {
            console.log('EOS');
        });
    }

    private _readAtom() {
        while (true) {
            if (this._offset >= this._buffer.length) return;

            let type: string;
            let size: number;
            size = this._buffer.readInt32BE(this._offset);
            type = this._buffer.toString('utf8', this._offset + 4, this._offset + 8);
            let atom = new Atom(size, type, this._streamOffset + this._offset, this._seq++);
            this._setAtomRel(atom);
            this._atoms.push(atom);

            this._addToPipes(atom);
            this.emit('atom', atom);

            if (this._hasChildAtom(this._offset + 8)) {
                this._offset += 8;
            }
            else {
                this._offset += size;
            }
        }
    }

    private _addToPipes(atom: Atom) {
        // if anyone is listening the data from this atom, adds it to the pipelines. 
        var ev = this.eventNames().find(en => {
            var eventName = en as string;
            return eventName == 'data_' + atom.type;
        });
        if (ev) {
            if (!this._pipes) this._pipes = [[atom.type, atom.size]];
            else if (this._pipes.map(p => p[0]).indexOf(atom.type) == -1)
                this._pipes.push([atom.type, atom.size]);
        }

        this._triggerPipe(this._offset);
    }

    private _triggerPipe(offset: number = 0) {
        let parser = this;
        if (this._pipes) {
            this._pipes.forEach((p, i) => {
                let atomName = p[0];
                let remains = p[1];
                let buf: Buffer;

                if (remains == 0) return;
                if (remains + offset > this._buffer.length) {
                    buf = Buffer.from(this._buffer.buffer, offset, this._buffer.length - offset);
                    p[1] -= (this._buffer.length - offset);
                }
                else {
                    buf = Buffer.from(this._buffer.buffer, offset, remains);
                    p[1] = 0;
                }

                process.nextTick(function () {
                    parser.emit('data_' + atomName, buf);
                })
            });
            this._pipes = this._pipes.filter(p => p[1] > 0);
        }

    }

    private _setAtomRel(atom: Atom) {
        for (let i = this._atoms.length - 1; i >= 0; --i) {
            if (this._atoms[i].includes(atom)) {
                atom.setParent(this._atoms[i]);
                return true;
            }
        }
        return false;
    }

    private _hasChildAtom(offset) {
        if (offset + 8 <= this._buffer.length)
            return this._isKnownTypes(this._buffer.toString('utf8', offset + 4, offset + 8));
        return false;
    }

    private _isKnownTypes(type: string) {
        return MP4Parser.allKnownTypes.indexOf(type) != -1;
    }

    static allKnownTypes = ["mdat", "idat", "free", "skip", "avcC", "hvcC", "ftyp", "styp", "payl", "vttC", "rtp ", "sdp ", "btrt", "frma", "trpy",
        "tpyl", "totl", "tpay", "dmed", "dimm", "drep", "nump", "npck", "maxr", "tmin", "tmax", "dmax", "pmax", "payt", "vmhd",
        "smhd", "hmhd", "idat", "meco", "udta", "strk", "free", "skip", "clap", "pasp", "mvhd", "tkhd", "mdhd", "hdlr", "vmhd",
        "smhd", "hmhd", "nmhd", "url ", "urn ", "ctts", "cslg", "stco", "co64", "stsc", "stss", "stsz", "stz2", "stts", "stsh",
        "mehd", "trex", "mfhd", "tfhd", "trun", "tfdt", "esds", "subs", "txtC", "sidx", "emsg", "prft", "pssh", "elst", "dref",
        "url ", "urn ", "sbgp", "sgpd", "cprt", "iods", "ssix", "tfra", "mfro", "pdin", "tsel", "trep", "leva", "stri", "stsg",
        "schm", "stvi", "padb", "stdp", "sdtp", "saio", "saiz", "meta", "xml ", "bxml", "iloc", "pitm", "ipro", "iinf", "infe",
        "iref", "mere", "kind", "elng", "ipma", "pixi", "ispe", "stsd", "iref", "moov", "trak", "sidx", "trak", "edts", "mdia",
        "minf", "dinf", "stbl", "sgpd", "sbgp", "mvex", "trex", "moof", "traf", "traf", "trun", "sgpd", "sbgp", "vttc", "tref",
        "iref", "udta", "mfra", "meco", "hnti", "hinf", "strk", "strd", "sinf", "rinf", "schi", "trgr", "udta", "kind", "iprp",
        "ipma", "ipco", "mp4v", "avc1", "avc2", "avc3", "avc4", "avcp", "drac", "encv", "mjp2", "mvc1", "mvc2", "resv", "s263",
        "svc1", "vc-1", "hvc1", "hev1", "mp4a", "ac-3", "alac", "dra1", "dtsc", "dtse", "dtsh", "dtsl", "ec-3", "enca", "g719",
        "g726", "m4ae", "mlpa", "raw ", "samr", "sawb", "sawp", "sevc", "sqcp", "ssmv", "twos", ".mp3", "Hint", "fdp ", "m2ts",
        "pm2t", "prtp", "rm2t", "rrtp", "rsrp", "rtp ", "sm2t", "srtp", "metx", "mett", "urim", "stpp", "wvtt", "sbtt", "tx3g",
        "stxt", "mp4s", "roll", "prol", "alst", "rap ", "tele", "avss", "avll", "sync", "tscl", "tsas", "stsa", "scif", "mvif",
        "scnm", "dtrt", "vipr", "tele", "rash", "msrc"];
}

