# mp4parser

**Parse atoms in MP4 stream using Nodejs.**

## Usage:  
1. Dump the structure of MP4 stream in progressive mode.  
```javascript
let parser = new MP4Parser(fs.createReadStream('resource\\sample.mp4'));
parser.on('atom', atom => {
    var seq = "0" + atom._seq;
    seq = seq.substring(seq.length - 2, seq.length);
    console.log(`${seq}. |${new Array(atom._level * 3).join('-')}${atom.type}(size:${atom.size}, pos:${atom._pos})`);
});
parser.start();
```
Output:  
```
00. |ftyp(size:32, pos:0)
01. |moov(size:100893, pos:32)
02. |--mvhd(size:108, pos:40)
03. |--trak(size:33680, pos:148)
04. |-----tkhd(size:92, pos:156)
05. |-----edts(size:36, pos:248)
06. |--------elst(size:28, pos:256)
07. |-----mdia(size:33544, pos:284)
08. |--------mdhd(size:32, pos:292)
09. |--------hdlr(size:45, pos:324)
10. |--------minf(size:33459, pos:369)
11. |-----------vmhd(size:20, pos:377)
12. |-----------dinf(size:36, pos:397)
13. |--------------dref(size:28, pos:405)
14. |-----------stbl(size:33395, pos:433)
```
2. Pipe data of specified Atom type out.  
```javascript
let parser = new MP4Parser(fs.createReadStream('resource\\sample.mp4'));
parser.on('data_mdat', chunk => {
    console.log(chunk.length);
});
parser.start();
```
Add `data_` before any atom type name whenever you want to get its data out. 

## NPM Repo:

https://www.npmjs.com/package/mp4parser
