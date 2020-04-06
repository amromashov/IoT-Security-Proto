'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const util = require('util');
const mysql = require("mysql2");
const cluster = require('cluster');
const hammingCode = require('hamming-code');

const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
const walletPath = path.join(process.cwd(), 'wallet');
const wallet = new FileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);


function randnum () { return Math.round(Math.random() * 10) };

function xor(str, key) {
    var newstr = '';
    for(let i=0; i < str.length; i++) {
        let char = str.charCodeAt(i) ^ key.charCodeAt(i);
        newstr += String.fromCharCode(char);
    }
    return newstr;
}

async function sendValues(cred) {
    //calls for a transaction every 24 hrs
    let gateway = new Gateway();
    let network = await gateway.getNetwork('mychannel');
    let contract = network.getContract('meter');
    setInterval( async function () {
        let user = cred.user;

        let userExists = await wallet.exists(user);
        if (!userExists) {
            console.log('An identity for the meter ' + user + ' does not exist in the wallet');
            return;
        }

        await gateway.connect(ccpPath, { wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });

        //connecting to mysql (client)
        let connection = mysql.createConnection({
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

        let start_ts = Date.now();
        let measures = [randnum(), randnum(), randnum()];
        let bufMeasures = Buffer.allocUnsafe(12);

        let counter = 0;
        let binaryString = '';

        while(counter < measures.length) {
            bufMeasures.writeUInt32BE(measures[counter], counter * 4);
            binaryString += '0'.repeat(32 - measures[counter].toString(2).length)+ measures[counter].toString(2);
            counter++;
        }

        let check = hammingCode.encode(binaryString));
        let payload = bufMeasures.toString() + check;
        let saltPart = cred.salt.slice(0, payload.length);
        let encrypted = xor(payload, saltPart);
        cred.salt = cred.salt.slice(payload.length);
        let ts = Date.now()/1000;
        try {
            await contract.submitTransaction('addRecord', encrypted, cred.publicKey, ts.toString());
            console.log('Transaction has been submitted');
        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
            process.exit(1);
        }


        let query = connection.query('UPDATE credentials SET salt = ? WHERE publicKey = ? ;', [cred.salt, cred.publicKey], function (error, results, fields) {
            if (error) throw error;
            console.log("Successfully updated credentials");
        });

        let end_ts = Date.now();
        let data = {
            id: id,
            ts_start: start_ts/1000,
            user: cred.user,
            duration: (end_ts - start_ts)/1000
        };

        query = connection.query('INSERT INTO transactions SET ?', data, function (error, results, fields) {
            if (error) throw error;
        });

       console.log('[' + id + '] ' + 'Transaction duration: ' + data.duration);

       await gateway.disconnect();

    }, 1000);

}

async function main() {

    //connecting to mysql (client)
    let connection = mysql.createConnection({
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

    //var numWorkers = require('os').cpus().length;
    var numWorkers = 2;
    if (cluster.isMaster) {
        for (var i = 0; i < numWorkers; i++) {
            cluster.fork();
        }
    } else {
        let query = connection.query('SELECT * FROM unused', '', async function (error, results, fields) {
            if (error) throw error;
            results.forEach(function(e) {
                //publicKeys.push(e.publicKey) 
                let query = connection.query('DELETE FROM unused WHERE publicKey = ?', [e.publicKey], function (error, results, fields) {
                    if (error) throw error;
                });
                query = connection.query('SELECT * FROM credentials WHERE publicKey = ?', [e.publicKey], function (error, results, fields) {
                    if (error) throw error;
                    if (!results) {
                        console.error('Failed to submit transaction: unknown publicKey ' + publicKey);
                        process.exit(1);
                    }
                    sendValues(e);
                });
            });
        });
    }

}


main();
