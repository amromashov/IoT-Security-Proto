'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
var PromisePool = require('es6-promise-pool');

const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
const fs = require('fs')

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

        const network = await gateway.getNetwork('mychannel');

        const contract = network.getContract('bench_chaincode');

        const total_amount = await contract.evaluateTransaction('totalRecords');

        const concurrency = 50;

        var start_ts = Date.now();
        var count = 0;
        var start = 0;
        var end = 0;

        while (end < total_amount) {
            end = 1000 + end;
            await contract.submitTransaction('prolong', start.toString(), end.toString());
            start = end;
        }

        console.log('Transaction has been submitted');

        await gateway.disconnect();
        console.log('Complete');
        var end_ts = Date.now();
        var duration = (end_ts - start_ts)/1000;
        console.log(`Total execution duration is: ${duration.toString()} secs`);
        return;


    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
