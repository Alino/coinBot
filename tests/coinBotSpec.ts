import { apiResponseMock } from './apiResponseMock';
import * as expect from 'expect';
import { CoinBot } from '../src/coinBot';

describe('coinBot', function () {
    describe('getCryptoById', function () {
        it('should return coinData by coinData.id', function () {
            const coinData = CoinBot.getCryptoById('litecoin', apiResponseMock);
            expect(coinData).toEqual({
                "id": "litecoin",
                "name": "Litecoin",
                "symbol": "LTC",
                "rank": "4",
                "price_usd": "48.1323",
                "price_btc": "0.0192396",
                "24h_volume_usd": "595198000.0",
                "market_cap_usd": "2497982493.0",
                "available_supply": "51898257.0",
                "total_supply": "51898257.0",
                "percent_change_1h": "-0.07",
                "percent_change_24h": "-1.5",
                "percent_change_7d": "19.65",
                "last_updated": "1499514241",
                "price_eur": "42.210101808",
                "24h_volume_eur": "521964838.08",
                "market_cap_eur": "2190630727.0"
            });
        })
    });

    describe('getBestCoinToBuyNow', function () {
        it('should return best coin to buy - that is closest with percent_change_1h to 1% increase', function () {
            const bestCoin = CoinBot.getBestCoinToBuyNow(apiResponseMock);
            expect(bestCoin).toEqual({
                "id": "veritaseum",
                "name": "Veritaseum",
                "symbol": "VERI",
                "rank": "17",
                "price_usd": "174.597",
                "price_btc": "0.0697906",
                "24h_volume_usd": "1127820.0",
                "market_cap_usd": "343615712.0",
                "available_supply": "1968050.0",
                "total_supply": "100000000.0",
                "percent_change_1h": "0.97",
                "percent_change_24h": "-5.74",
                "percent_change_7d": "108.68",
                "last_updated": "1499514254",
                "price_eur": "153.11458512",
                "24h_volume_eur": "989053.0272",
                "market_cap_eur": "301337235.0"
            })
        })
    })
});
