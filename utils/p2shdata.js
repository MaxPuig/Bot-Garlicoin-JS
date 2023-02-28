import fs from 'fs';
import RpcClient from 'garlicoind-rpc';
import dotenv from 'dotenv';
dotenv.config();
const config = { protocol: 'http', user: process.env.RPC_USER, pass: process.env.RPC_PASSWORD, host: process.env.HOST_IP, port: process.env.PORT, };
let rpc = new RpcClient(config);
import util from 'util';
import garlicore from 'bitcore-lib-grlc';


const getRawTransaction = util.promisify(rpc.getRawTransaction).bind(rpc);


/* Return location and info of file */
async function decodeP2SHDATA(txid) {
    let rawTx;
    await getRawTransaction(txid)
        .then(success => rawTx = success.result)
        .catch(err => console.log(err));
    let tx = garlicore.Transaction(rawTx).toObject();
    let title = tx.outputs.filter((vout) => { return vout.satoshis == 0 })[0].script;
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
    let decodedTitle = decodeTitle(title);
    fs.writeFileSync('./data/' + decodedTitle.filename + '.' + decodedTitle.filetype, Buffer.from(data, "hex"));
    console.log(`File saved: ./data/${decodedTitle.filename}.${decodedTitle.filetype}`);
    return { file_location: `./data/${decodedTitle.filename}.${decodedTitle.filetype}`, title: decodedTitle };
}


function decodeTitle(vout_string) {
    let hex = vout_string.slice(6); // remove the first 3 bytes (OP_CODES)
    let site = hexToAscii(hex.slice(0, 24)).replace(/\x00/g, '');
    let protocol = hexToAscii(hex.slice(24, 44)).replace(/\x00/g, '');
    let version = hexToDecimal(hex.slice(44, 48));
    let filename = hexToAscii(hex.slice(48, 80)).replace(/\x00/g, '');
    let filetype = hexToAscii(hex.slice(80, 88)).replace(/\x00/g, '');
    let filesize = hexToDecimal(hex.slice(88, 96));
    let assembly_script = hex.slice(96, 120);
    let datahash160 = hex.slice(120, 160);
    let info = { site, protocol, version, filename, filetype, filesize, assembly_script, datahash160 };
    info.assembly_script = decodeAssemblyScript(assembly_script);
    return info;
}


function decodeAssemblyScript(entire_assembly_script) {
    let assembly_script_length = hexToDecimal(entire_assembly_script.slice(0, 2));
    let script = entire_assembly_script.slice(2, assembly_script_length * 2 + 2);
    let data_location = script.slice(0, 6);
    let first_vin = hexToDecimal(script.slice(2, 4));
    let last_vin = hexToDecimal(script.slice(4, 6));
    let encoding_type = 'ASCII';
    let encoding;
    if (script.includes('ec')) {
        encoding = script.slice(6, 10);
        encoding_type = encoding.slice(2, 4);
        if (encoding_type == '64') {
            encoding_type = 'base64';
        } else if (encoding_type == '16') {
            encoding_type = 'hex';
        } else if (encoding_type == '10') {
            encoding_type = 'base10';
        } else if (encoding_type == 'f8') {
            encoding_type = 'UTF-8';
        } else {
            encoding_type = 'ASCII';
        }
    }
    let info = { entire_assembly_script, assembly_script_length, script, data_location, first_vin, last_vin, encoding_type };
    if (encoding) info.encoding = encoding;
    return info;
}


function hexToAscii(hex) { return Buffer.from(hex, 'hex').toString(); }


function hexToDecimal(hex) { return parseInt(hex, 16); }


export { decodeP2SHDATA };