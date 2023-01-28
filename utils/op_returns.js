import dotenv from 'dotenv';
dotenv.config();
import { getDatabase, setDatabase } from './database.js';
import { decodeP2SHDATA } from './p2shdata.js';
import RpcClient from 'garlicoind-rpc';
import fs from 'fs';
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
                            if (hex.length <= 10) hex = vout.scriptPubKey.hex.slice(4); // Small OP_Returns have 1 less byte
                            let ascii;
                            let txid = resp.result.txid;
                            try { ascii = hexToAscii(hex) } catch { ascii = "Can't convert to ASCII" };
                            op_returns.push([hex, ascii, txid]);
                        }
                    });

                    if (op_returns.length > 0) {
                        sendNotif(op_returns, client);
                    }
                })
            });
            txids = ret.result;
        });
    });
}


async function sendNotif(ops, client) {
    let msg_send = { content: '**New OP_RETURN:**\n```', files: [] };
    let p2shdata = false;
    let p2shdata_info;
    for (const tx of ops) msg_send.content += `HEX: ${tx[0]}\nASCII: ${tx[1]}\nTXID: ${tx[2]}\n` + '```';
    try {
        if (hexToAscii(ops[0][0].slice(24, 44)).replace(/\x00/g, '') == '/p2shdata') { // checks if it uses the /p2shdata protocol
            p2shdata = true;
            p2shdata_info = await decodeP2SHDATA(ops[0][2]);
            msg_send.files.push({ attachment: p2shdata_info.file_location });
            msg_send.content += '```' + JSON.stringify(p2shdata_info.title, null, 2) + '```';
        }
    } catch (error) { console.log(error) } // In case the file can't be decoded
    const op_return_channels = await getDatabase('op_return_channels');
    for (const channel of op_return_channels) {
        try {
            await client.channels.cache.get(channel).send(msg_send);
        } catch (error) {
            console.log(error);
        }
    }
    if (p2shdata) {
        fs.unlink(p2shdata_info.file_location, (err) => {
            if (err) throw err;
            console.log('file deleted successfully');
        });
    }
}


function hexToAscii(hex) { return Buffer.from(hex, 'hex').toString(); }


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