"use strict";
const fs = require("fs");
const mp4parser_1 = require("./mp4parser");
let parser = new mp4parser_1.default(fs.createReadStream('resource\\sample.mp4'));
parser.on('atom', atom => {
    var seq = "0" + atom._seq;
    seq = seq.substring(seq.length - 2, seq.length);
    console.log(`${seq}. |${new Array(atom._level * 3).join('-')}${atom.type}(size:${atom.size}, pos:${atom._pos})`);
});
parser.on('data_mdat', chunk => {
    console.log(chunk.length);
});
parser.start();
//# sourceMappingURL=example.js.map