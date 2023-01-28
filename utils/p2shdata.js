import { ElectrumClient } from '@samouraiwallet/electrum-client';
import garlicore from 'bitcore-lib-grlc';
import fs from 'fs';
const client = new ElectrumClient(50002, 'services.garlicoin.ninja', 'tls');


/* Return buffer of file */
async function decodeP2SHDATA(txid) {
    connectToElectrum();
    let rawTx = await client.blockchainTransaction_get(txid);
    client.close();
    let tx = garlicore.Transaction(rawTx).toObject();
    let data_array = tx.inputs.map((vin) => { return vin.script });
    let data = '';
    for (let chunk of data_array) {
        if (chunk.startsWith('4d')) { // deletes the first 6 and the last 11 bytes (OP_CODES)
            chunk = chunk.slice(12);
            data += chunk.slice(0, -22);
        } else if (chunk.startsWith('4c')) { // deletes the first 4 and the last 11 bytes (OP_CODES)
            chunk = chunk.slice(8);
            data += chunk.slice(0, -22);
        } else { // deletes the first 2 and the last 11 bytes (OP_CODES)
            chunk = chunk.slice(4);
            data += chunk.slice(0, -22);
        }
    }
    return Buffer.from(data, 'hex');
}


function connectToElectrum() {
    try {
        client.initElectrum(
            { client: 'electrum-client-js', version: ['1.2', '1.4'] },
            { retryPeriod: 5000, maxRetry: 10, pingPeriod: 5000 }
        );
    } catch (error) {
        console.log(error);
    }
}


export { decodeP2SHDATA };