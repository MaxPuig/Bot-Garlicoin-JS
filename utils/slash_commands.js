import { send_tx } from './tGRLC.js';
import { help_wallet } from './help.js';
import { getBalanceGRLC } from './utils.js';
import garlicore from 'bitcore-lib-grlc';


async function slash_commands(interaction) {
    if (interaction.commandName == 'wallet') {
        if (interaction.options._subcommand == 'send') {
            const password = interaction.options.getString('password');
            const receiver = interaction.options.getString('receiver');
            const amount = interaction.options.getString('amount');
            const op_return = interaction.options.getString('op_return'); // undefined (Handled)
            const change_address = interaction.options.getString('change_address'); // undefined
            let result = await send_tx(password, receiver, amount, op_return, change_address);
            interaction.reply({ content: result.toString(), ephemeral: true });
        } else if (interaction.options._subcommand == 'help') {
            interaction.reply(help_wallet());
        } else if (interaction.options._subcommand == 'my_address') {
            const password = interaction.options.getString('password');
            interaction.reply({ content: 'Wallet: ' + new garlicore.PrivateKey(garlicore.crypto.BN.fromBuffer(garlicore.crypto.Hash.sha256(Buffer.from(password)))).toAddress().toString(), ephemeral: true });
        } else if (interaction.options._subcommand == 'balance') {
            const address_or_password = interaction.options.getString('address_or_password');
            const value = interaction.options.getString('value');
            if (address_or_password == 'password') {
                const wallet = new garlicore.PrivateKey(garlicore.crypto.BN.fromBuffer(garlicore.crypto.Hash.sha256(Buffer.from(value)))).toAddress().toString();
                const balance = await getBalanceGRLC(wallet);
                if (balance.error) {
                    interaction.reply({ content: balance.data, ephemeral: true });
                    return;
                } else {
                    interaction.reply({ content: '**Wallet:** ' + wallet + '\n**Balance:** ' + balance.data + ' GRLC🧄', ephemeral: true });
                }
            } else {
                if (garlicore.Address.isValid(value)) {
                    let balance = await getBalanceGRLC(value);
                    if (balance.error) {
                        interaction.reply({ content: balance.data, ephemeral: true })
                    } else {
                        interaction.reply({ content: '**Wallet:** ' + value + '\n**Balance:** ' + balance.data + ' GRLC🧄', ephemeral: true });
                    };
                } else {
                    interaction.reply({ content: 'Invalid address', ephemeral: true });
                }
            }
        }
    }
}


export { slash_commands }