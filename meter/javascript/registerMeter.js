'use strict';

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');

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

    const contract = network.getContract('meter');

    //connecting to mysql (client)
    const mysql = require("mysql2");

    const connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        database: "meter",
        password: "yZ356One"
    });
    connection.connect(function(err){
        if (err) {
            return console.error(err.message);
        } else {
            console.log("Successfully connected MySQL server");
        }
    });


    var start_ts = Date.now();
    var counterUsers = 0;
    var amountUsers = process.argv[2];

    while(counterUsers < amountUsers) {
        try {

            var user = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

            var userExists = await wallet.exists(user);
            if (userExists) {
                console.log('An identity for the user ' + user + ' already exists in the wallet');
                return;
            }


            var secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: user, role: 'client' }, adminIdentity);
            var enrollment = await ca.enroll({ enrollmentID: user, enrollmentSecret: secret });
            var userIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(user, userIdentity);
            console.log('Successfully registered and enrolled user ' + user + ' and imported it into the wallet');

            //generating secret, public and salt both for client and ss
            var publicKey = "";
            var secretKey = "";
            var salt = "";
            var untill = 50 * 1024;
            var counter = 0;
            while (counter < untill) {
                salt += Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 1);
                counter++;
            }
            counter = 0;
            while (counter < 64) {
                publicKey += Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 1);
                secretKey += Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 1);
                counter++;
            }

            var cred = {
                user : user,
                secretKey : secretKey,
                publicKey : publicKey,
                salt : salt,
            };
            console.log('publicKey: ' + cred.publicKey);

            var query = connection.query('INSERT INTO credentials SET ?', cred, function (error, results, fields) {
                if (error) throw error;
            });


            query = connection.query('INSERT INTO unused VALUES (?)', [cred.publicKey], function (error, results, fields) {
                if (error) throw error;
            });

            // writing creds for serverside

            await contract.submitTransaction('addCredential', cred.publicKey, JSON.stringify(cred));
            console.log('Transaction has been submitted');
            counterUsers++;

        } catch (error) {
            console.error(`Failed to register user: ${error}`);
            process.exit(1);
        }
    }

    connection.end(function(err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Connection to MySQL dropped");
    });

    await gateway.disconnect();
    var end_ts = Date.now();
    var duration = (end_ts - start_ts)/1000;
    console.log(`Total execution duration is: ${duration.toString()} secs`);

}

main();
