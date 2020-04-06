'use strict';

const { Contract } = require('fabric-contract-api');

class BenchChaincode extends Contract {

    async createRecord(ctx, id, ts) {
        console.info('============= START : Create Record ===========');

        const record = {
            ts,
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(record)));
        console.info('============= END : Create Record ===========');
    }

    async prolong(ctx, start, end) {
        console.info('============= START : Prolongation ===========');
        const startKey = '';
        const endKey   = '';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const Prolonged = [];
        var count = 0;
        while (true) {
            const res = await iterator.next();
            count++;
            if (count < parseInt(start)) {
                continue;
            }

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                if (Math.floor(Date.now() / 1000) > Record.ts){
                    Record.ts = (parseInt(Record.ts) + 2419200).toString();
                    await ctx.stub.putState(Key, Buffer.from(JSON.stringify(Record)));
                    Prolonged.push({ Key, Record });
                }
            }
            if (res.done || count >= parseInt(end)) {
                await iterator.close();
                console.info('Prolonged:');
                console.info(Prolonged);
                break;
            }
        }
        console.info('============= END : Prolongation ===========');
    }

    async totalRecords(ctx) {

        const startKey = '';
        const endKey = '';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        var amount = 0;

        while (true) {
            const res = await iterator.next();
            amount++;

            if (res.done) {
                console.log('Total amount of records is ' + amount);
                await iterator.close();
                return JSON.stringify(amount);
            }
        }
    }

    async queryAll(ctx) {

        const startKey = '';
        const endKey = '';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults);
            }
        }
    }

}

module.exports = BenchChaincode;
