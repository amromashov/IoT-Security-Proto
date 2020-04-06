'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');
var PromisePool = require('es6-promise-pool');

const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');

async function main() {

    try {

        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });

        var start_ts = Date.now();

        const network = await gateway.getNetwork('mychannel');

        const contract = network.getContract('bench_chaincode');

        const amount = process.argv[2];
        const concurrency = 50;

        var id;
        var ts;
        var result = {};
        var count = 0;

        var promiseProducer = function () {
            if (count < amount) {
                count++;
                id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
                ts = Math.floor(Date.now() / 1000);
                result[count] = {
                    id : id,
                    ts : ts,
                };
                return contract.submitTransaction('createRecord', id, ts.toString());
            } else {
                return null;
            }
        }

        var pool = new PromisePool(promiseProducer, concurrency);

        pool.start().then(async function () {
            await gateway.disconnect();
            console.log('Complete');
            var end_ts = Date.now();
            var duration = (end_ts - start_ts)/1000;
            console.log(`Total execution duration is: ${duration.toString()} secs`);
            return;
        });

        console.log('Transaction has been submitted');


        const jsonString = JSON.stringify(result)
        fs.writeFile(Math.floor(Date.now() / 1000) + "_generated.json", jsonString, err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file ' + Math.floor(Date.now() / 1000) + "_generated.json" )
            }
        })


    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
