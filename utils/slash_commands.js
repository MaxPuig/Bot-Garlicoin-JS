import { send_tx } from './tGRLC.js';
import { help_wallet } from './help.js';
import { getBalancetGRLC, getBalanceGRLC } from './utils.js';
import { validate } from 'multicoin-address-validator';
import garlicore from 'garlicore-lib';


async function slash_commands(interaction) {
    if (interaction.commandName == 'wallet') {
        if (interaction.options._subcommand == 'send') {
            interaction.reply({ content: 'This command is not ready yet.', ephemeral: true });
            return;
            const password = interaction.options.getString('password');
            const reciever = interaction.options.getString('reciever');
            const amount = interaction.options.getNumber('amount');
            const op_return = interaction.options.getString('op_return'); // undefined (Handled)
            const change_address = interaction.options.getString('change_address'); // undefined
            let result = await send_tx(password, reciever, amount, op_return, change_address);
            interaction.reply({ content: result.toString(), ephemeral: true });
        } else if (interaction.options._subcommand == 'help') {
            interaction.reply(help_wallet());
        } else if (interaction.options._subcommand == 'my_address') {
            const password = interaction.options.getString('password');
            const grlc_or_tgrlc = interaction.options.getString('grlc_or_tgrlc');
            if (grlc_or_tgrlc == 'grlc') garlicore.Networks.defaultNetwork = garlicore.Networks.mainnet;
            interaction.reply({ content: 'Wallet: ' + new garlicore.PrivateKey(garlicore.crypto.BN.fromBuffer(garlicore.crypto.Hash.sha256(Buffer.from(password)))).toAddress().toString(), ephemeral: true });
            garlicore.Networks.defaultNetwork = garlicore.Networks.testnet;
        } else if (interaction.options._subcommand == 'balance') {
            const address_or_password = interaction.options.getString('address_or_password');
            const value = interaction.options.getString('value');
            const grlc_or_tgrlc = interaction.options.getString('grlc_or_tgrlc');
            if (address_or_password == 'password') {
                if (grlc_or_tgrlc == 'grlc') {
                    garlicore.Networks.defaultNetwork = garlicore.Networks.mainnet;
                    const wallet = new garlicore.PrivateKey(garlicore.crypto.BN.fromBuffer(garlicore.crypto.Hash.sha256(Buffer.from(value)))).toAddress().toString();
                    garlicore.Networks.defaultNetwork = garlicore.Networks.testnet;
                    const balance = await getBalanceGRLC(wallet);
                    if (balance.error) {
                        interaction.reply({ content: balance.data, ephemeral: true });
                        return;
                    } else {
                        interaction.reply({ content: '**Wallet:** ' + wallet + '\n**Balance:** ' + balance.data + ' ' + grlc_or_tgrlc.toUpperCase() + '🧄', ephemeral: true });
                    }
                } else {
                    const wallet = new garlicore.PrivateKey(garlicore.crypto.BN.fromBuffer(garlicore.crypto.Hash.sha256(Buffer.from(value)))).toAddress().toString();
                    const balance = await getBalancetGRLC(wallet);
                    if (balance.error) {
                        interaction.reply({ content: balance.data, ephemeral: true });
                        return;
                    } else {
                        interaction.reply({ content: '**Wallet:** ' + wallet + '\n**Balance:** ' + balance.data + ' ' + grlc_or_tgrlc.toUpperCase() + '🧄', ephemeral: true });
                    }
                }
            } else {
                if (validate(value, 'grlc', 'both')) {
                    let balance;
                    if (grlc_or_tgrlc == 'tgrlc') {
                        balance = await getBalancetGRLC(value);
                    } else {
                        balance = await getBalanceGRLC(value);
                    }
                    if (balance.error) {
                        interaction.reply({ content: balance.data, ephemeral: true })
                    } else {
                        interaction.reply({ content: '**Wallet:** ' + value + '\n**Balance:** ' + balance.data + ' ' + grlc_or_tgrlc.toUpperCase() + '🧄', ephemeral: true });
                    };
                } else {
                    interaction.reply({ content: 'Invalid address', ephemeral: true });
                }
            }
        }
    }
}


export { slash_commands }