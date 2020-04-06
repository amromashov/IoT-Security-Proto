'use strict';


var Meter = function(uid) {

    this.uid = uid;
    this.user = '';
    this.salt = '';
    this.secret = '';
    return this;
}

Meter.prototype.request = async function() {


    function randnum () { return Math.round(Math.random() * 10) };

    function xor(a, b) {
        if (!Buffer.isBuffer(a)) a = new Buffer(a)
        if (!Buffer.isBuffer(b)) b = new Buffer(b)
        var res = [];
        for (var i = 0; i < b.length; i++) {
            res.push(a[i] ^ b[i])
        }
        return new Buffer(res);
    }

    let measures = [randnum(), randnum(), randnum()];
    let bufMeasures = Buffer.allocUnsafe(16);
    let counter = 0;
    let sum = 0;

    while(counter < measures.length) {
        bufMeasures.writeUInt32BE(measures[counter], counter * 4);
        sum = sum + measures[counter];
        counter++;
    }

    bufMeasures.writeUInt32BE(sum, 12);

    let payload = bufMeasures.toString();
    let salt = this.salt.substr(0, 16);
    console.log(salt);

    this.salt = this.salt.substr(16);

    var encrypted = xor(payload, salt).toString();

    let data = {
        encrypted : encrypted,
        uid : this.uid,
        user :this.user,
        command : 'create_record',
    };

    console.log(data);
    console.log(JSON.stringify(data));
    const {PromiseSocket} = require("promise-socket");
    const socket = new PromiseSocket();
    await socket.connect(9030, "localhost");
    await socket.write(JSON.stringify(data));
    await socket.end();
    let res = await socket.readAll();
    console.log(res);

    //updating credentials after transaction
    const mysql      = require('mysql2/promise');
    const connection =  await mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'yZ356One',
        database : 'meter',
    });
    let [rows, fields] = await connection.execute('UPDATE credentials SET salt = ? WHERE publicKey = ? ;', [this.salt, this.uid]);

    connection.end(function(err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Connection to MySQL dropped");
    });
}

Meter.prototype.fillData = async function() {
    const mysql      = require('mysql2/promise');
    const connection =  await mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'yZ356One',
        database : 'meter',
    });

    let [rows, fields] = await connection.execute('SELECT * FROM `credentials` WHERE `publicKey` = ?', [this.uid]);
    this.user = rows[0].user;
    this.salt = rows[0].salt;
    this.secret = rows[0].secret;

    connection.end(function(err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Connection to MySQL dropped");
    });
}

module.exports.Meter = Meter;
