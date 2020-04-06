'use strict';

const { Contract } = require('fabric-contract-api');

class Meter extends Contract {

    async addCredential(ctx, publicKey, data) {
        console.info('============= START : Adding Credential ===========');
        let cred = JSON.parse(data);
        console.log(cred);
        await ctx.stub.putState(publicKey, Buffer.from(JSON.stringify(cred)));
        console.info('============= END : Adding Credential ===========');
    }

    async addRecord(ctx, encrypted, publicKey, ts) {

        function xor(str, key){
            var newstr = '';
            for(let i=0; i < str.length; i++) {
                let char = str.charCodeAt(i) ^ key.charCodeAt(i);
                newstr += String.fromCharCode(char);
            }
            return newstr;
        }

        function bin_to_dec(bstr) { return parseInt((bstr + '').replace(/[^01]/gi, ''), 2); }

        console.info('============= START : Create Record ===========');

        const credentials = await ctx.stub.getState(publicKey);
        if (!credentials) {
            console.error('FAILED TO FIND METER');
            throw new Error('FAILED TO FIND METER')
        }

        var chunk = {encrypted: encrypted, credentials: credentials };

        const {PromiseSocket} = require("promise-socket");
        const socket = new PromiseSocket();
        await socket.connect(3561, "localhost");
        await socket.write(JSON.stringify(chunk));
        const response = await socket.readAll();
        var measures = JSON.parce(response.toString());
        await socket.end();

        const record = {
            user,
            measures,
            ts,
        };

        let id = user + '_' + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(record)));

        cred.salt = cred.salt.slice(payload.length);
        await ctx.stub.putState(user, Buffer.from(JSON.stringify(cred)));

        console.info('============= END : Create Record ===========');
    }

}

module.exports = Meter;
