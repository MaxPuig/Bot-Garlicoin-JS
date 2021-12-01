# Bot-Garlicoin-JS
Discord bot that sends info about garlicoin and user's wallets.\
Make transactions on the blockchain using slash commands.\
The bot is Mainnet or Testnet only (use .env file to choose).

# Commands
- `!prefix` --> Changes the prefix of commands. ("!" by default) Only triggerable by Server Admins.
- `!price` --> Current price of GRLC. Also accepts !price {other currency} --> !price eur
- `!register {Address}` --> Saves user address to userWallets.json (!register forget --> to remove the address from the database)
- `!info` --> Info about pool / (pool + user info if registered)
- `!balance` --> Balance of registered wallet. Also accepts !balance {other currency} --> !balance eur
- `/wallet` --> Send GRLC using slash commands. More info `/wallet help`
- `/lottery` --> Demonstration of how a lottery would work.

# SETUP
- install node.js >= 16.6.0
  - Windows/macOS: https://nodejs.org/es/download/current/
  - Linux:
    ```
    sudo apt update
    sudo apt install nodejs
    sudo apt install npm
    sudo npm cache clean -f
    sudo npm install -g n
    sudo n stable
    ```
- clone repository: `git clone https://github.com/MaxPuig/Bot-Garlicoin-JS.git`
- Download needed packages: `npm install`
- Change `\node_modules\garlicore-lib\lib\networks.js` line 155 `scripthash: 0xc4,` to `scripthash: 0x3a,`. (Testnet bug)
  - @nuc1e4r5n4k3: Litecoin has 2 version bytes for p2sh, a legacy one that collided with other stuff and a modern one that should be used instead. When GRLC launched we inherited that code, but ignored the legacy version because, well, we had no legacy stuff anyway. That js code has used the legacy testnet p2sh version byte (0xc4, 196) instead of the new one (0x3a, 58). https://github.com/garlicoin-project/garlicore-lib/blob/segwit/lib/networks.js#L155
- create ".env" file like follows:
  ```
  # Discord Token
  TOKEN = 'Your.Discord.Token'

  # CoinMarketCap Token
  TOKENCMC = 'CoinMarketCapToken'
  
  # RPC config. Should match garlicoin.conf
  RPC_USER = 'user'
  RPC_PASSWORD = 'password'
  RPC_HOST_IP = '127.0.0.1'
  RPC_PORT = '42068
  
  #'tGRLC' or 'GRLC' to chose the network
  T_GRLC = 'tGRLC'

  # Lottery config
  LOTTERY_PASSWORD = 'password'
  ```
  `Garlicoin.conf` (used by garlicoin core):
  ```
  server=1
  # Uncomment to use testnet
  # testnet=1
  rpcuser=user
  rpcpassword=password
  addnode=freshgrlc.net
  rpcport=42068
  ```

-  Run bot `node index.js`