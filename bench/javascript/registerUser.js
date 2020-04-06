'use strict';

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');
const PromisePool = require('es6-promise-pool');

const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');

async function main() {

    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const adminExists = await wallet.exists('admin');
    if (!adminExists) {
        console.log('An identity for the admin user "admin" does not exist in the wallet');
        console.log('Run the enrollAdmin.js application before retrying');
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

    const ca = gateway.getClient().getCertificateAuthority();
    const adminIdentity = gateway.getCurrentIdentity();

    const network = await gateway.getNetwork('mychannel');

    const contract = network.getContract('bench_chaincode');

    var mysql      = require('mysql');
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'yZ356One',
        database : 'meter',
    });

    var start_ts = Date.now();
    var counterUsers = 0;
    var owner = process.argv[2];
    var amountUsers = process.argv[3];
    var cred = [];

    while(counterUsers < amountUsers) {
        try {

            var device = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

            var userExists = await wallet.exists(device);
            if (userExists) {
                console.log('An identity for the device ' + device + ' already exists in the wallet');
                return;
            }

            var secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: device, role: 'client' }, adminIdentity);
            var enrollment = await ca.enroll({ enrollmentID: device, enrollmentSecret: secret });
            var userIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(device, userIdentity);
            console.log('Successfully registered and enrolled device ' + device + ' and imported it into the wallet');

            //generating secret, public and salt both for client and ss
            var did = "";
            var secret = "";
            var salt = "";
            var untill = 50 * 1024;
            var counter = 0;
            while (counter < untill) {
                salt += Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 1);
                counter++;
            }
            counter = 0;
            while (counter < 64) {
                did += Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 1);
                secret += Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 1);
                counter++;
            }

            cred.counterUsers = {
                owner : owner,
                device : device,
                secret : secret,
                did : did,
                salt : salt,
            };

            var query = connection.query('INSERT INTO credentials SET ?', cred.counterUsers, function (error, results, fields) {
                if (error) throw error;
            });


            query = connection.query('INSERT INTO unused VALUES (?)', [cred.counterUsers.did], function (error, results, fields) {
                if (error) throw error;
            });

            await contract.submitTransaction('addCredential', cred.counterUsers.did, JSON.stringify(cred.counterUsers));
            console.log('Transaction has been submitted');
            counterUsers++;

        } catch (error) {
            console.error(`Failed to register user: ${error}`);
            process.exit(1);
        }
    }

    var end_ts = Date.now();
    var duration = (end_ts - start_ts)/1000;
    console.log(`Total execution duration is: ${duration.toString()} secs`);
    connection.end(function(err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Connection to MySQL dropped");
    });

    await gateway.disconnect();
}

main();
