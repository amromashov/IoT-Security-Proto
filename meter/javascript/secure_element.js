'use strict';

const hammingCode = require('hamming-code');
const Net = require('net');
const port = 3561;

function xor(str, key){
    var newstr = '';
    for(let i=0; i < str.length; i++) {
        let char = str.charCodeAt(i) ^ key.charCodeAt(i);
        newstr += String.fromCharCode(char);
    }
    return newstr;
}

function bin_to_dec(bstr) { return parseInt((bstr + '').replace(/[^01]/gi, ''), 2); }

async function getMeasures(chunk) {

    let data = JSON.parse(chunk.toString());
    let cred = data.credentials;
    let encrypted = data.encrypted;

    let bufEncrypted = Buffer.from(encrypted);
    let key = cred.salt.slice(0, encrypted.length);

    let payload = xor(encrypted, key);
    let bufPayload = Buffer.from(payload);

    let check = hammingCode.decode(bufPayload.toString('utf8', 12, bufPayload.length));

    var measures = [];

    let binaryString = '';
    let counter = 0;
    while(counter < 3) {
        measures.push(bufPayload.readUInt32BE(counter * 4));
        binaryString += '0'.repeat(32 - measures[counter].toString(2).length)+ measures[counter].toString(2);
        counter++;
    }

    if (binaryString != check) {
        let counter = 0;
        while(counter < 3) {
            measures[i] = bin_to_dec(check.substr(counter * 32));
            counter++;
        }
    }

    return measures;
}

const server = new Net.Server();
server.listen(port, 'localhost', function() {
    console.log(`Server listening for connection requests on socket localhost:${port}.`);
});

server.on('connection', function(socket) {
    console.log('A new connection has been established.');

    socket.on('data', function(chunk) {
        let res = await getParams(chunk);
        socket.end(res.toString);
    });

    socket.on('end', function() {
        console.log('Closing connection with the client');
    });

    socket.on('error', function(err) {
        console.log(`Error: ${err}`);
        socket.end();
    });
});
