'use strict';


function Meter(username, interval) {

    this.username = username;
    this.RETRIES = 0;
    this.INTERVAL_HANDLER = null;
    this.INTERVAL = interval || 86400000;

}

Meter.prototype.StartRequests = function StartRequests() {
    let mysql = require("mysql2");
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

    let query = connection.query('SELECT * FROM used WHERE username = ?', [this.username], async function (error, results, fields) {
        if (error) throw error;
        if (results[0]) {
            this.INTERVAL_HANDLER = setInterval(this.Request(result[0], this.INTERVAL));
        }
    });

    connection.end(function(err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Connection to MySQL dropped");
    });
}

Meter.prototype.DropRequest = function DropRequest() {
    clearInterval(this.INTERVAL_HANDLER);
}

Meter.prototype.Request = function Request(cred) {

    function randnum () { return Math.round(Math.random() * 10) };

    function xor(str, key) {
        let newstr = '';
        for(let i=0; i < str.length; i++) {
            let char = str.charCodeAt(i) ^ key.charCodeAt(i);
            newstr += String.fromCharCode(char);
        }
        return newstr;
    }

    let hammingCode = require('hamming-code');
    let mysql = require("mysql2");
    let { FileSystemWallet, Gateway } = require('fabric-network');
    let path = require('path');

    let ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');

    let walletPath = path.join(process.cwd(), 'wallet');
    let wallet = new FileSystemWallet(walletPath);

    let userExists = await wallet.exists(this.username);
    if (!userExists) {
        console.log('An identity for the user ' + this.username + ' does not exist in the wallet');
        return;
    }

    let gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: this.username });

    let network = await gateway.getNetwork('mychannel');

    let contract = network.getContract('meter');

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
        binaryString += measures[counter].toString(2);
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

        connection.end(function(err) {
            if (err) {
                return console.log(err.message);
            }
            console.log("Connection to MySQL dropped");
        });
        if (this.RETRIES >= 10) {
            this.DropRequests();
        }
        this.RETRIES++;
        this.Request(cred);
        return null;

    }

    let query = connection.query('UPDATE used SET salt = ? WHERE username = ? ;', [cred.salt, cred.username], function (error, results, fields) {
        if (error) throw error;
        console.log("Successfully updated used credentials");
    });

    let end_ts = Date.now();
    let tid = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
    let data = {
        tid: tid,
        ts_start: start_ts/1000,
        username: cred.user,
        duration: (end_ts - start_ts)/1000
    };

    query = connection.query('INSERT INTO transactions SET ?', data, function (error, results, fields) {
        if (error) throw error;
    });

    console.log('[' + tid + '] ' + 'Transaction duration: ' + data.duration);

    await gateway.disconnect();

    connection.end(function(err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Connection to MySQL dropped");
    });
};

module.exports = Meter;
