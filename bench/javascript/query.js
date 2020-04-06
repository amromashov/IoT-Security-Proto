'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');

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

        var start_ts = Date.now();
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });

        const network = await gateway.getNetwork('mychannel');

        const contract = network.getContract('bench_chaincode');

        const result = await contract.evaluateTransaction('queryAll');
        console.log(`Transaction has been evaluated`);

        fs.writeFile(Math.floor(Date.now() / 1000) + "_world_state.json", result, err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file ' + Math.floor(Date.now() / 1000) + "_world_state.json" )
            }
        })

        var end_ts = Date.now();
        var duration = (end_ts - start_ts)/1000;
        console.log(`Total execution duration is: ${duration.toString()} secs`);

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();
