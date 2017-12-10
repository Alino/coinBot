import * as _ from 'lodash';
import * as rp from 'request-promise';

type coinData = {
    id: string,
    name: string,
    symbol: string,
    rank: string,
    price_usd: string,
    price_btc: string,
    "24h_volume_usd": string,
    market_cap_usd: string,
    available_supply: string,
    total_supply: string,
    percent_change_1h: string,
    percent_change_24h: string,
    percent_change_7d: string,
    last_updated: string,
    price_eur: string,
    "24h_volume_eur": string,
    market_cap_eur: string
}
type coinsData = coinData[];



export class CoinBot {
    ownedCoins: {
        [key: string]: {
            count: number,
            buyPriceEur: number
        }
    };
    currentCoinsData: coinsData;
    previousCoinsData: coinsData;
    totalMoneyEarned: number;
    bestCoinToBuy: string;
    currentPercentIncreaseRecord: number;
    static requiredPercentChangeToSwap: -1;
    static secondsBetweenChecks = 60 * 4;
    static shapeShiftCurrencies = [
        'Bitcoin',
        'Ethereum',
        'Golem',
        'Siacoin',
        'Aragon',
        'Basic Attention Token',
        'Bancor',
        'Bitcoin Cash',
        'Blackcoin',
        'Bitshares',
        'Civic',
        'Dash',
        'Decred',
        'DigixDao',
        'Dogecoin',
        'Edgeless',
        'EOS',
        'Ethereum Classic',
        'Factoids',
        'FunFair',
        'GameCredits',
        'Gnosis',
        'Matchpool',
        'Iconomi',
        'Komodo',
        'LBRY Credits',
        'Litecoin',
        'Melon',
        'Metal',
        'Monacoin',
        'Namecoin',
        'Numeraire',
        'OmiseGo',
        'Potcoin',
        'Augur',
        'Reddcoin',
        'iExec',
        'Status',
        'Startcoin',
        'SingularDTV',
        'Swarm City',
        'TokenCard',
        'WeTrust',
        'Voxels',
        'Vericoin',
        'Vertoin',
        'Ripple',
        'Zcash'
    ];

    constructor() {
        this.ownedCoins = {
            bitcoin: {
                count: 0.2,
                buyPriceEur: 3542
            }
        };
        this.totalMoneyEarned = 0;
        this.currentPercentIncreaseRecord = 0;
        this.loop();
        let secondsLeft = CoinBot.secondsBetweenChecks;
        setInterval(() => {
            --secondsLeft;
            process.stdout.write(`next check in ${secondsLeft} seconds\r`);
            if (secondsLeft < 1) {
                process.stdout.write(`checking now:\r`);
                secondsLeft = CoinBot.secondsBetweenChecks;
                this.loop();
            }
        }, 1000);
    }

    static filterCoins(currentCoinsData: coinsData) {
        return currentCoinsData.filter((coinData) => {
            return _.includes(CoinBot.shapeShiftCurrencies, coinData.name);
        })
    }

    loop() {
        CoinBot.getCoinData().then((data) => {
            let currentCoinsData: coinsData = JSON.parse(data);
            currentCoinsData = CoinBot.filterCoins(currentCoinsData);
            if (!this.previousCoinsData) this.previousCoinsData = currentCoinsData;
            this.currentCoinsData = currentCoinsData;
            const bestCoin = CoinBot.getBestCoinToBuyNow(currentCoinsData);
            if (this.bestCoinToBuy !== bestCoin.id) {
                console.log(`best coin to buy: ${bestCoin.id} ${bestCoin.percent_change_1h}%`);
                this.bestCoinToBuy = bestCoin.id;
            }
            // swap ownedCoins whose dropped more than 1% last hour with the best coin to buy now
            Object.keys(this.ownedCoins).forEach((key, index, arr) => {
                let didSwap = false;
                const coin = CoinBot.getCryptoById(key, currentCoinsData);
                const diff = parseFloat(coin.price_eur) - this.ownedCoins[coin.id].buyPriceEur;
                const diffPercentage = diff / this.ownedCoins[coin.id].buyPriceEur * 100;
                if (diffPercentage > this.currentPercentIncreaseRecord) {
                    this.currentPercentIncreaseRecord = diffPercentage;
                }
                if (bestCoin.id != coin.id) {
                    if (diffPercentage < -1 || parseFloat(coin.percent_change_1h) < -1
                    || (this.currentPercentIncreaseRecord > 0 && (diffPercentage - this.currentPercentIncreaseRecord) < -1)) {
                        this.swapCoin(coin.id, bestCoin.id);
                        console.log(`owned coins: ${JSON.stringify(this.ownedCoins)}`);
                        didSwap = true;
                    }
                }
                if (!didSwap && index === arr.length - 1) {
                    // const diff = parseFloat(coin.percent_change_1h) - parseFloat(CoinBot.getCryptoById(coin.id, this.previousCoinsData).percent_change_1h);
                    // console.log(`not going to trade, your ${coin.id} has changed by ${diff}% from last check`)
                    console.log(`not going to trade, your ${coin.id} has changed by ${diff} eur (${diffPercentage}%) since bought.`);
                }
            });
            this.previousCoinsData = currentCoinsData;
        }).catch(function (error) {
            console.error(error);
        });
    }

    static getCoinData() {
        const url = `https://api.coinmarketcap.com/v1/ticker/?convert=EUR`;
        return rp(url);
    }

    swapCoin(fromId: string, toId: string) {
        // calculate
        const fromPriceEur = (parseFloat(CoinBot.getCryptoById(fromId, this.currentCoinsData).price_eur) * this.ownedCoins[fromId].count);
        const toPriceEur = parseFloat(CoinBot.getCryptoById(toId, this.currentCoinsData).price_eur);
        const toCoinCount = fromPriceEur / toPriceEur;
        const moneyEearned = fromPriceEur - (this.ownedCoins[fromId].buyPriceEur * this.ownedCoins[fromId].count);
        this.totalMoneyEarned += moneyEearned;
        // log
        console.log(`swapping ${this.ownedCoins[fromId].count} ${fromId} for ${toCoinCount} ${toId}`);
        console.log(moneyEearned > 0 ? "\x1b[32m%s\x1b[0m" : "\x1b[41m%s\x1b[0m", `you ${moneyEearned > 0 ? 'earn' : 'lose'} ${moneyEearned} eur`)
        console.log(`total money earned: ${this.totalMoneyEarned}`)
        // execute
        this.ownedCoins[toId] = {
            count: toCoinCount,
            buyPriceEur: toPriceEur
        }
        this.currentPercentIncreaseRecord = 0;
        delete this.ownedCoins[fromId];
    }

    static getCryptoById(id: string, coinsData: coinsData): coinData {
        return _.find(coinsData, (coin) => coin.id === id);
    }

    // best coin to buy now is the one that is closest with percent_change_1h to 1% increase
    static getBestCoinToBuyNow(currentCoinsData: coinsData): coinData {
        return closestIndex(currentCoinsData, 1);
    }
}




function closestIndex(array: coinsData, num: number) {
    let minDiff = 1000;
    let ans;
    for (let i in array) {
        var m = Math.abs(num - parseFloat(array[i].percent_change_1h));
        if (m < minDiff) {
            minDiff = m;
            ans = array[i];
        }
    }
    return ans;
}