'use strict';
var cluster = require('cluster');
const Net = require('net');
const port = 9060;
const m = require('./meter');
const client = require('prom-client');
let meterPool = [];
let workers = [];
let timers = [];
let numWorkers = 2;
let interval = 86400;


async function generateMeters(amount, parity, numWorkers) {
    console.log(parity);
    amount = amount || 0;
    let meter;
    const mysql      = require('mysql2/promise');
    const connection =  await mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'yZ356One',
        database : 'meter',
    });
    let [rows, fields] = await connection.execute('SELECT * FROM `unused` LIMIT ' + amount);
    let counter = 0;
    while (counter < amount) {
        let check = counter % numWorkers;
        if (check != parity) {
            counter++;
            continue;
        }
        if (rows[counter]) {
            meterPool.push(new m.Meter(rows[counter].publicKey));
            await connection.execute('DELETE FROM `unused` WHERE `publicKey` = ?', [rows[counter].publicKey]);
            await meterPool[meterPool.length - 1].fillData();
            counter++;
        } else {
            break;
        }
    }
    connection.end(function(err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Connection to MySQL dropped");
    });
    console.log('meters available on worker: ' + meterPool.length);
}

async function timer(time) {
    interval = time;
    console.log('current interval: ' + interval);
}

async function start() {
    meterPool.forEach(function(meter) {
        timers.push(
            setInterval( function() {
                meter.request();
            //}, interval + Math.floor(Math.random() * 20000)
            }, interval
            )
        );
    });
    console.log('working meters on worker: ' + timers.length);
}

async function stop () {
    timers.forEach(function(item) {
        clearInterval(item);
    });

    const mysql      = require('mysql2/promise');
    const connection =  await mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'yZ356One',
        database : 'meter',
    });
    meterPool.forEach(function(meter) {
        let query = connection.query('INSERT INTO unused VALUES (?)', [meter.uid], function (error, results, fields) {
            if (error) throw error;
        });
    });
    meterPool = [];
    connection.end(function(err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Connection to MySQL dropped");
    });
}

function workerProcess() {
    process.on('message', function(message) {
        if (message.command == 'start') {
            start();
        } else if (message.command == 'stop') {
            stop();
        } else if (message.command == 'amount') {
            generateMeters(message.value, message.parity, numWorkers);
        } else if (message.command == 'interval') {
            timer(message.value);
        }
    });

}

function masterProcess() {
        const collectDefaultMetrics = client.collectDefaultMetrics;
        const prefix = 'meter_';
        collectDefaultMetrics({ prefix });

        const total_meters   = new client.Gauge({ name: 'total_meters', help : 'total amount of meters mounted'});

        for (var i = 0; i < numWorkers; i++) {
            workers.push(cluster.fork());
        }
        const server = new Net.Server();
        server.listen(port, 'localhost', function() {
            console.log(`Server listening for connection requests on socket localhost:${port}.`);
        });

        server.on('connection', function(socket) {
            console.log('A new connection has been established.');

            socket.on('data', function(chunk) {
                let data = JSON.parse(chunk.toString());
                console.log(data);
                if (data.command == 'start') {
                    for (let i = 0; i < numWorkers; i++) {
                        workers[i].send({ command: 'start' });
                    }
                } else if (data.command == 'interval') {
                    for (let i = 0; i < numWorkers; i++) {
                        workers[i].send({ command: 'interval', value: data.value });
                    }
                } else if (data.command == 'stop') {
                    for (let i = 0; i < numWorkers; i++) {
                        workers[i].send({ command: 'stop' });
                    }
                    total_meters.set(0);
                } else if (data.command == 'amount') {
                    for (let i = 0; i < numWorkers; i++) {
                        workers[i].send({ command: 'amount', parity: i, value: data.value });
                    }
                    total_meters.inc(parseInt(data.value));
                } else {
                    let response = {
                        status : 400,
                        msg : 'unknown command'
                    }
                    socket.end(JSON.stringify(response));
                }
            });

            socket.on('end', function() {
                console.log('Closing connection with the client');
            });

            socket.on('error', function(err) {
                console.log(`Error: ${err}`);
                socket.end();
            });
        });

}

async function metrics() {
    const express = require('express')
    const bodyParser = require('body-parser');
    let app = express();
    app.use(bodyParser.json());
    app.get('/metrics', (req, res) => {
        res.set('Content-Type', client.register.contentType)
        res.end(client.register.metrics())
        });
    app.listen(9070, function (err) {
        if (err) {
            throw err;
        }
    });
    console.log(`Metrics server listening for connection requests on socket localhost:9070.`);
}

async function main() {
    // Master branch
    if (cluster.isMaster) {
        masterProcess();
        metrics();
    }
    // Worker branch
    else {
        workerProcess();
    }
}

main();
