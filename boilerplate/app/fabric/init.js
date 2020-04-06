const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', 'config', 'connection.json');

module.exports.getTransactions = async function getTransactions(did, amount, callback) {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const adminExists = await wallet.exists('admin');
    if (!adminExists) {
        console.log('An identity for the admin user "admin" does not exist in the wallet');
        console.log('Run the admin.js script before retrying');
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true} });

    const ca = gateway.getClient().getCertificateAuthority();
    const adminIdentity = gateway.getCurrentIdentity();

    const network = await gateway.getNetwork('mychannel');

    const contract = network.getContract('bench_chaincode');

    let result;

    var start_ts = Date.now();
    try { 
        result = await contract.evaluateTransaction('getTransactions', did, amount);
        console.log('Transaction has been submitted');  
    } catch (error) {
        console.error(`Failed to get transactions: ${error}`);
        return(null, 'Failed to get transactions');
    }
    
    var end_ts = Date.now();
    var duration = (end_ts - start_ts)/1000;
    console.log(`Total execution duration is: ${duration.toString()} secs`);

    await gateway.disconnect();
    return result;
}

module.exports.registerDevice = async function registerDevice(device, callback) {

    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const adminExists = await wallet.exists('admin');
    if (!adminExists) {
        console.log('An identity for the admin user "admin" does not exist in the wallet');
        console.log('Run the admin.js script before retrying');
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true} });

    const ca = gateway.getClient().getCertificateAuthority();
    const adminIdentity = gateway.getCurrentIdentity();

    const network = await gateway.getNetwork('mychannel');

    const contract = network.getContract('bench_chaincode');

    let devices = {};
    var start_ts = Date.now();
    try {
        await contract.submitTransaction('addCredential', device.did, JSON.stringify(device));
        devices = JSON.parse(await contract.evaluateTransaction('getUser', device.owner));
        devices.push(device);
        await contract.submitTransaction('addUser', device.owner, JSON.stringify(devices));
        console.log('Transactions has been submitted');
    } catch (error) {
        console.error(`Failed to register user: ${error}`);
        return(null, 'Failed to register user');
    }

    var end_ts = Date.now();
    var duration = (end_ts - start_ts)/1000;
    console.log(`Total execution duration is: ${duration.toString()} secs`);

    await gateway.disconnect();

    return('OK', null)
}

module.exports.getDevice = async function getDevice(device, callback) {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const adminExists = await wallet.exists('admin');
    if (!adminExists) {
        console.log('An identity for the admin user "admin" does not exist in the wallet');
        console.log('Run the admin.js script before retrying');
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true} });

    const ca = gateway.getClient().getCertificateAuthority();
    const adminIdentity = gateway.getCurrentIdentity();

    const network = await gateway.getNetwork('mychannel');

    const contract = network.getContract('bench_chaincode');

    let result;

    var start_ts = Date.now();
    try { 
        result = await contract.evaluateTransaction('getCredential', device.did);
        console.log('Transaction has been submitted');  
    } catch (error) {
        console.error(`Failed to register user: ${error}`);
        return(null, 'Failed to register user');
    }
    
    var end_ts = Date.now();
    var duration = (end_ts - start_ts)/1000;
    console.log(`Total execution duration is: ${duration.toString()} secs`);

    await gateway.disconnect();
    return result;
}

module.exports.getUser = async function getUser(user, callback) {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const adminExists = await wallet.exists('admin');
    if (!adminExists) {
        console.log('An identity for the admin user "admin" does not exist in the wallet');
        console.log('Run the admin.js script before retrying');
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true} });

    const ca = gateway.getClient().getCertificateAuthority();
    const adminIdentity = gateway.getCurrentIdentity();

    const network = await gateway.getNetwork('mychannel');

    const contract = network.getContract('bench_chaincode');

    let result;

    var start_ts = Date.now();
    try { 
        result = await contract.evaluateTransaction('getUser', user);
        console.log('Transaction has been submitted');  
    } catch (error) {
        console.error(`Failed to register user: ${error}`);
        return(null, 'Failed to register user');
    }
    
    var end_ts = Date.now();
    var duration = (end_ts - start_ts)/1000;
    console.log(`Total execution duration is: ${duration.toString()} secs`);

    await gateway.disconnect();
    return result;
}

module.exports.registerUser = async function registerUser(user, callback) {

    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const adminExists = await wallet.exists('admin');
    if (!adminExists) {
        console.log('An identity for the admin user "admin" does not exist in the wallet');
        console.log('Run the admin.js script before retrying');
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true} });

    const ca = gateway.getClient().getCertificateAuthority();
    const adminIdentity = gateway.getCurrentIdentity();

    const network = await gateway.getNetwork('mychannel');

    const contract = network.getContract('bench_chaincode');

    var start_ts = Date.now();
    try {
        await contract.submitTransaction('addUser', user, JSON.stringify({}));
        console.log('Transaction has been submitted');
    } catch (error) {
        console.error(`Failed to register user: ${error}`);
        return(null, 'Failed to register user');
    }

    var end_ts = Date.now();
    var duration = (end_ts - start_ts)/1000;
    console.log(`Total execution duration is: ${duration.toString()} secs`);

    await gateway.disconnect();

    return('OK', null)
}