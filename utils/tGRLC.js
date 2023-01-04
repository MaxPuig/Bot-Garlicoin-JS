import axios from 'axios';
import RpcClient from 'garlicoind-rpc';
import garlicore from 'bitcore-lib-grlc';
import dotenv from 'dotenv';
dotenv.config();
const config = { protocol: 'http', user: process.env.RPC_USER, pass: process.env.RPC_PASSWORD, host: process.env.HOST_IP, port: process.env.PORT, };
let rpc = new RpcClient(config);
import util from 'util';


async function send_tx(password, receiver, amount, op_return, change_address) {
    if (!Number(amount)) return 'Invalid amount. Use a dot for decimal places.'; else amount = Number(amount);
    const tx = {
        password: password,
        receiver_address: receiver,
        change_address: change_address,
        amount_to_send_grlc: amount,
        op_return: op_return,
    }
    if (!garlicore.Address.isValid(receiver)) return 'Invalid receiver address. Must be a GRLC address.';
    if (change_address && !garlicore.Address.isValid(change_address)) return 'Invalid change address.';
    if (amount <= 0) return 'Amount must be greater than 0.';
    const transaction = await getRawTransaction(tx);
    let output = {};
    if (transaction.error) return transaction.error;
    if (transaction.warning) output.warning = transaction.warning;
    const send = util.promisify(rpc.sendRawTransaction).bind(rpc);
    await send(transaction.tx).then(success => output = success).catch(err => output = err);
    if (output.error) return output.error.message;
    if (output.result) return `You sent ${amount} GRLC🧄 to ${receiver}\nYou can check the transaction at https://explorer.freshgrlc.net/grlc/transactions/${output.result}`;
    else return 'Something went wrong with the RPC connection.\nBot\'s fault or it could also be because you have balance in multiple address types.\n`' + output.toString() + '`';
}


async function get_utxos(address) {
    try {
        const response = await axios.get(`https://api.freshgrlc.net/blockchain/grlc/address/${address}/utxos/`);
        const utxos = response.data;
        const script = new garlicore.Script(address);
        let all_utxos = []
        for (let tx of utxos) {
            const utxo = new garlicore.Transaction.UnspentOutput({
                "txId": tx.transaction.txid,
                "outputIndex": tx.index,
                "address": address,
                "script": script,
                "amount": tx.value,
            });
            all_utxos.push(utxo);
        }
        return all_utxos;
    } catch (error) {
        return [];
    }
}


async function getRawTransaction({ password, receiver_address, change_address, amount_to_send_grlc, op_return }) {
    try {
        let warning;
        const privateKey = new garlicore.PrivateKey(garlicore.crypto.BN.fromBuffer(garlicore.crypto.Hash.sha256(Buffer.from(password))));
        const amount_to_send_sats = amount_to_send_grlc * 100_000_000;
        const utxo = await get_utxos(privateKey.toAddress());
        if (!change_address) change_address = privateKey.toAddress();
        if (utxo.length === 0) return { error: 'No utxo found.' };
        let transaction = new garlicore.Transaction()
            .from(utxo)
            .to(receiver_address, Math.floor(amount_to_send_sats))
            .change(change_address) // Sets up a change address where the rest of the funds will go
        if (op_return) transaction.addData(op_return.toString()) // Add OP_RETURN data
        transaction.sign(privateKey);
        return { tx: transaction.serialize(), warning: warning };
    } catch (error) {
        return { error: 'Something went wrong. Possible causes:\n-Not enough funds or not enough funds for fees\n-Try a lower amount\nError: `' + error.message.toString() + '`' };
    }
}


export { send_tx };