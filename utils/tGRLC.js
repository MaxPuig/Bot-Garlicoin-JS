import axios from 'axios';
import RpcClient from 'garlicoind-rpc';
import garlicore from 'garlicore-lib';
import dotenv from 'dotenv';
dotenv.config();
const config = { protocol: 'http', user: process.env.RPC_USER, pass: process.env.RPC_PASSWORD, host: process.env.RPC_HOST_IP, port: process.env.RPC_PORT, };
let rpc = new RpcClient(config);
import util from 'util';
import { validateAddress } from './utils.js';
const send = util.promisify(rpc.sendRawTransaction).bind(rpc);
const grlc_or_tgrlc = process.env.T_GRLC;
if (grlc_or_tgrlc.toLowerCase() == 'tgrlc') {
    garlicore.Networks.defaultNetwork = garlicore.Networks.testnet;
}


async function send_tx(password, receiver, amount, op_return, change_address) {
    if (!Number(amount)) return 'Invalid amount. Use a dot for decimal places.'; else amount = Number(amount);
    const tx = {
        password: password,
        receiver_address: receiver,
        change_address: change_address,
        amount_to_send_grlc: amount,
        op_return: op_return,
    }
    let valid_receiver = await validateAddress(receiver);
    let valid_change_address = await validateAddress(change_address);
    if (valid_receiver.error) return "Something went wrong with the RPC connection. (Bot's fault)"
    if (!valid_receiver.isValid) return `Invalid receiver address. Must be a ${grlc_or_tgrlc} address.`;
    if (change_address && valid_change_address.error) return "Something went wrong with the RPC connection. (Change address) (Bot's fault)"
    if (change_address && !valid_change_address.isValid) return `Invalid change address. Must be a ${grlc_or_tgrlc} address.`;
    if (amount <= 0) return "Amount must be greater than 0";
    const transaction = await getRawTransaction(tx);
    let output;
    if (transaction.error) return transaction.error;
    if (transaction.warning) output.warning = transaction.warning;
    await send(transaction.tx).then(success => output = success).catch(err => output = err);
    // error: { code: -26, message: '66: min relay fee not met' } aaaa
    if (output.code) return `Error: ${output.message} (code: ${output.code})`;
    // success: { result: '7df85948bdb9abb54124cccb36efd80e50b0f4aa809b8e49bb9d70eca8bdf852', error: null, id: 57032 }
    if (output.result) return `You sent ${amount} ${grlc_or_tgrlc}🧄 to ${receiver}\nYou can check the transaction at https://explorer.freshgrlc.net/${grlc_or_tgrlc.toLowerCase()}/transactions/${output.result}`;
    else return "Something went wrong with the RPC connection. (Bot's fault)";
}


async function get_utxos(address) {
    const response = await axios.get(`https://api.freshgrlc.net/blockchain/${grlc_or_tgrlc.toLowerCase()}/address/${address}/utxos/`);
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
    if (op_return) transaction.addData(op_return.toString()); // Add OP_RETURN data
    transaction.sign(privateKey);

    const fee_sats = ((transaction.serialize(true).length / 2) / 1000) * garlicore.Transaction.FEE_PER_KB; // true = serialize ignoring errors
    if (fee_sats > (tx_amount_grlc - amount_to_send_grlc) * 100_000_000) { // fee excedes the total amount to send
        warning = 'Fee excedes the total amount to send. Subtracting fee from amount to send.';
        transaction = new garlicore.Transaction()
            .from(utxo[0])
            .to(receiver_address, Math.floor(amount_to_send_sats - fee_sats))
            .change(change_address)
        if (op_return) transaction.addData(op_return.toString());
        transaction.sign(privateKey);
    }
    return { tx: transaction.serialize(), warning: warning, total: tx_amount_grlc };
}


export { send_tx };