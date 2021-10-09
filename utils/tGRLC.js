import axios from 'axios';
import RpcClient from 'garlicoind-rpc';
import garlicore from 'garlicore-lib';
import dotenv from 'dotenv';
dotenv.config();
import { validate } from 'multicoin-address-validator';
garlicore.Networks.defaultNetwork = garlicore.Networks.testnet;
const config = { protocol: 'http', user: process.env.USERNAME, pass: process.env.PASSWORD, host: process.env.HOST_IP, port: process.env.PORT, };
let rpc = new RpcClient(config);
import util from 'util';


async function send_tx(password, reciever, amount, op_return, change_address) {
    const tx = {
        password: password,
        receiver_address: reciever,
        change_address: change_address,
        amount_to_send_grlc: amount,
        op_return: op_return,
    }
    if (!validate(reciever, 'grlc', 'testnet')) return 'Invalid receiver address. Must be a tGRLC address.';
    if (change_address && !validate(change_address, 'grlc', 'testnet')) return 'Invalid change address.';
    const transaction = await getRawTransaction(tx);
    let output = { total_before: transaction.total };
    if (transaction.error) return transaction.error;
    if (transaction.warning) output.warning = transaction.warning;
    const send = util.promisify(rpc.sendRawTransaction).bind(rpc);
    await send(transaction.tx).then(success => output = success).catch(err => output = err);
    if (output.error) return output.error.message;
    if (output.result) return `You sent ${amount} tGRLC🧄 to ${reciever}\nYou can check the transaction at https://explorer.freshgrlc.net/tgrlc/transactions/${output.result}`;
    else return "Something went wrong with the RPC connection. (Bot's fault)";
}


async function get_utxos(address) {
    const response = await axios.get(`https://api.freshgrlc.net/blockchain/tgrlc/address/${address}/utxos/`);
    const utxos = response.data;
    const script = new garlicore.Script(address);
    let all_utxos = []
    let total = 0;
    for (let tx of utxos) { // Probably could be done with .map()
        total += tx.value;
        const utxo = new garlicore.Transaction.UnspentOutput({
            "txId": tx.transaction.txid,
            "outputIndex": tx.index,
            "address": address,
            "script": script,
            "amount": tx.value,
        });
        all_utxos.push(utxo);
    }
    return [all_utxos, total];
}


async function getRawTransaction({ password, receiver_address, change_address, amount_to_send_grlc, op_return }) {
    let warning;
    // add userID to pswd
    const privateKey = new garlicore.PrivateKey(garlicore.crypto.BN.fromBuffer(garlicore.crypto.Hash.sha256(Buffer.from(password))));
    const amount_to_send_sats = amount_to_send_grlc * 100_000_000;
    const utxo = await get_utxos(privateKey.toAddress());
    if (!change_address) change_address = privateKey.toAddress();
    if (utxo[0].length === 0) return { error: 'No utxo found.' };
    const tx_amount_grlc = utxo[1];
    if (tx_amount_grlc < amount_to_send_grlc) return { error: 'Insufficient funds.' };
    let transaction = new garlicore.Transaction()
        .from(utxo[0])
        .to(receiver_address, Math.floor(amount_to_send_sats))
        .change(change_address) // Sets up a change address where the rest of the funds will go
    if (op_return) transaction.addData(op_return.toString()) // Add OP_RETURN data
    transaction.sign(privateKey);

    const fee_sats = ((transaction.serialize(true).length / 2) / 1000) * garlicore.Transaction.FEE_PER_KB; // true = serialize ignoring errors
    if (fee_sats > (tx_amount_grlc - amount_to_send_grlc) * 100_000_000) { // fee excedes the total amount to send
        warning = 'Fee excedes the total amount to send. Subtracting fee from amount to send.';
        transaction = new garlicore.Transaction()
            .from(utxo[0])
            .to(receiver_address, Math.floor(amount_to_send_sats - fee_sats))
            .change(change_address)
        if (op_return) transaction.addData(op_return.toString())
        transaction.sign(privateKey);
    }
    return { tx: transaction.serialize(), warning: warning, total: tx_amount_grlc };
}


export { send_tx };