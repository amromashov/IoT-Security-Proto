'use strict';
const Net = require('net');
const port = 9030;

const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
const prefix = 'meter_';
collectDefaultMetrics({ prefix });
const success = new client.Counter({
      name: 'success_transaction',
      help: 'total amount of succeeded transactions',
});
const failure = new client.Counter({
      name: 'failure_transaction',
      help: 'total amount of failed transactions',
});
const durationHist = new client.Histogram({
    name: 'transaction_duration',
    help: 'transaction_duration',
    buckets: client.linearBuckets(0, 0.1, 50) //Create 50 buckets, starting on 0 and a width of 0.1
});

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
const walletPath = path.join(process.cwd(), 'wallet');
const wallet = new FileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

async function metrics() {
    const express = require('express')
    const bodyParser = require('body-parser');
    let app = express();
    app.use(bodyParser.json());
    app.get('/metrics', (req, res) => {
        console.log('METRICS');
        res.set('Content-Type', client.register.contentType)
        res.end(client.register.metrics())
        });
    app.listen(9080, function (err) {
        if (err) {
            throw err;
        }
    });
    console.log(`Metrics server listening for connection requests on socket localhost:9080.`);
}

const Bull = require('bull');
const queue = new Bull('queue');
queue.process(async function (job, done) => {
  return performTransaction(job.data, done);
});
queue.on('completed', (job, result) => {
  console.log(`Job completed with result ${result}`);
});

async function performTransaction(data, done) {
    const userExists = await wallet.exists(data.user);
    if (!userExists) {
        console.log('An identity for the user ' + data.user + ' does not exist in the wallet');
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: data.user, discovery: { enabled: true, asLocalhost: true } });

    const network = await gateway.getNetwork('mychannel');

    const contract = network.getContract('bench_chaincode');

    var start_ts = Date.now();
    try {
        var res = await contract.submitTransaction('createRecord', data.encrypted, data.uid);
        success.inc();
        var end_ts = Date.now();
        var duration = (end_ts - start_ts)/1000;
        console.log(`Total execution duration is: ${duration.toString()} secs`);
        durationHist.observe(duration);
        await gateway.disconnect();
        return done(null, res);
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        failure.inc();
        var end_ts = Date.now();
        var duration = (end_ts - start_ts)/1000;
        durationHist.observe(duration);
        console.log(`Total execution duration is: ${duration.toString()} secs`);
        await gateway.disconnect();
        return done(new Error(error));
    }
}

async function main() {

    const server = new Net.Server();
    server.listen(port, 'localhost', function() {
        console.log(`Server listening for connection requests on socket localhost:${port}.`);
    });

    server.on('connection', function(socket) {
        console.log('A new connection has been established.');
        socket.on('data', function(chunk) {
            let data = JSON.parse(chunk.toString());
            if (data.command == 'create_record') {
                queue.add(data);
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
    metrics();
}

main();
