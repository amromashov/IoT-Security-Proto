
async function main() {
const {PromiseSocket} = require("promise-socket");
const socket = new PromiseSocket();
await socket.connect(9060, "localhost");
let json = {
    command: 'interval', value : process.argv[2]
};
	await socket.write(JSON.stringify(json));
	await socket.end();
    let res = await socket.readAll();
    console.log(res);
}

main();
