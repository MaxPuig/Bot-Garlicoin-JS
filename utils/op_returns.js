import dotenv from 'dotenv';
dotenv.config();
import { getDatabase, setDatabase } from './database.js';
import RpcClient from 'garlicoind-rpc';
const config = {
    protocol: 'http',
    user: process.env.RPC_USER,
    pass: process.env.RPC_PASSWORD,
    host: '127.0.0.1',
    port: '42068',
};
const rpc = new RpcClient(config);
let txids = [];


function showNewTransactions(client) {
    rpc.getRawMemPool(function (err, ret) {
        if (err) {
            console.error(err);
            return setTimeout(showNewTransactions, 10000);
        }

        function batchCall() {
            ret.result.forEach(function (txid) {
                if (txids.indexOf(txid) === -1) {
                    rpc.getRawTransaction(txid);
                }
            });
        }

        rpc.batch(batchCall, function (err, rawtxs) {
            if (err) {
                console.error(err);
                return setTimeout(showNewTransactions, 10000);
            }
            rawtxs.map(function (rawtx) {
                rpc.decodeRawTransaction(rawtx.result.toString('hex'), function (err, resp) {
                    let op_returns = [];
                    resp.result.vout.forEach(function (vout) {
                        if (vout.scriptPubKey.type == 'nulldata') {
                            let hex = vout.scriptPubKey.asm.split('OP_RETURN ')[1];
                            let ascii;
                            let txid = resp.result.txid;
                            try { ascii = hex_to_ascii(hex) } catch { ascii = "Can't convert to ASCII" };
                            op_returns.push([hex, ascii, txid]);
                        }
                    });

                    if (op_returns.length > 0) {
                        sendNotif(op_returns, client);
                    }
                })
            });
            txids = ret.result;
            setTimeout(showNewTransactions, 2500);
        });
    });
}


async function sendNotif(ops, client) {
    let msg = '**New OP_RETURN:**\n```';
    for (const tx of ops) msg += `HEX: ${tx[0]}\nASCII: ${tx[1]}\nTXID: ${tx[2]}\n` + '```';
    const op_return_channels = await getDatabase('op_return_channels');
    for (const channel of op_return_channels) {
        try {
            client.channels.cache.get(channel).send(msg);
        } catch (error) {
            console.log(error);
        }
    }
}


function hex_to_ascii(str1) {
    var hex = str1.toString();
    var str = '';
    for (var n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
}


async function saveOP_returnChannel(msg) {
    let op_return_channels = await getDatabase('op_return_channels');
    if (op_return_channels.includes(msg.channel.id)) {
        for (let i = 0; i < op_return_channels.length; i++) {
            if (op_return_channels[i] === msg.channel.id) {
                op_return_channels.splice(i, 1);
            }
        }
        await setDatabase(op_return_channels);
        msg.channel.send("This channel will no longer receive alerts.");
    } else {
        op_return_channels.push(msg.channel.id);
        await setDatabase(op_return_channels);
        msg.channel.send("This channel will receive alerts.");
    }
}


export { showNewTransactions, saveOP_returnChannel };