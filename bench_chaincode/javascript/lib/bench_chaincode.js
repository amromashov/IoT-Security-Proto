'use strict';

const { Contract } = require('fabric-contract-api');


class BenchChaincode extends Contract {


    async addUser (ctx, user, data) {
        console.info('============= START : Adding User Devices ===========');
        let cred = JSON.parse(data);
        await ctx.stub.putState(user, Buffer.from(JSON.stringify(cred)));
        console.info('============= END : Adding User Devices ===========');
    }

    async getUser (ctx, user) {
        console.info('============= START : Getting User Devices ===========');
        let devices = await ctx.stub.getState(user);
        console.info('============= END : Getting User Devices ===========');
        return devices
    }


    async addCredential(ctx, uid, data) {
        console.info('============= START : Adding Credential ===========');
        let cred = JSON.parse(data);
        await ctx.stub.putState(uid, Buffer.from(JSON.stringify(cred)));
        console.info('============= END : Adding Credential ===========');
    }

    async getCredential(ctx, uid) {
        console.info('============= START : Getting Credential ===========');
        let cred = await ctx.stub.getState(uid);
        console.info('============= END : Getting Credential ===========');
        return cred
    }

    async getTransactions(ctx, uid, amount) {
        const startKey = uid + '9999999999';
        const endKey   = uid + '1000000000';
        const allResults = [];
        let counter = 0;
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            if (counter >= amount) {
                // if amount == 0 then all transactions will be queried
                if (amount) {
                    break;
                }
            }
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
            counter++;
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async createRecord(ctx, encrypted, uid) {

        function xor(a,b) {
            if (!Buffer.isBuffer(a)) a = new Buffer(a)
            if (!Buffer.isBuffer(b)) b = new Buffer(b)
            var res = [];
            for (var i = 0; i < b.length; i++) {
                res.push(a[i] ^ b[i])
            }
            return new Buffer(res);
        }

        console.info('============= START : Create Record ===========');

        const credentials = await ctx.stub.getState(uid);
        if (!credentials) {
            console.error('FAILED TO FIND METER');
            throw new Error('FAILED TO FIND METER')
        }

        let cred = JSON.parse(credentials.toString());
        let salt = cred.salt.substr(0,16);

        let payload = xor(encrypted, salt);
        let measures = [];
        let counter = 0;
        let check = 0;

        while(counter < 3) {
            measures.push(payload.readUInt32BE(counter * 4));
            check = check + measures[counter];
            counter++;
        }
        let sum = payload.readUInt32BE(12);
        console.log('measures: ' + measures);
        console.log('check: ' + check + '; checksum from payload: ' + sum);

        if (sum != check) {
            throw new Error('Sum of measures not equal with checksum');
        }

        let ts = Date.now()/1000;
        const record = {
            measures,
            ts,
        };

        let id = uid + '_' + ts;

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(record)));

        cred.salt = cred.salt.slice(payload.length);
        await ctx.stub.putState(uid, Buffer.from(JSON.stringify(cred)));
        console.info('============= END : Create Record ===========');
        return JSON.stringify({status: 200});
    }

}

module.exports = BenchChaincode;
