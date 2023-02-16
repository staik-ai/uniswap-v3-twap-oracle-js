const { ethers } = require('ethers')
// IMPORTS AND SETUP

const JSBI = require('jsbi') // jsbi@3.2.5
const { abi: IUniswapV3PoolABI } = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const { TickMath, FullMath } = require('@uniswap/v3-sdk')

require('dotenv').config()

const POOL_ADDRESS = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'
const TOKEN0 = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' // USDC
const TOKEN1 = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' // WETH
const INFURA_URL_MAINNET = process.env.INFURA_URL_MAINNET

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_MAINNET)
const poolContract = new ethers.Contract(
  POOL_ADDRESS,
  IUniswapV3PoolABI,
  provider
)

async function main(pool, seconds) {
  const secondsAgo = [seconds, 0]

  const observeData = await pool.observe(secondsAgo)
  const tickCumulatives = observeData.tickCumulatives.map(v => Number(v))

  const tickCumulativesDelta = tickCumulatives[1] - tickCumulatives[0]

  const arithmeticMeanTick = (tickCumulativesDelta / secondsAgo[0]).toFixed(0)

  const arithmeticMeanTickInt = parseInt(arithmeticMeanTick)
  const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(arithmeticMeanTickInt)

  const ratioX192 = JSBI.multiply(sqrtRatioX96, sqrtRatioX96)

  const baseToken = TOKEN0 // USDC
  const quoteToken = TOKEN1 // WETH
  const baseAmount = JSBI.BigInt( 10000 * (10**6))
  const shift = JSBI.leftShift( JSBI.BigInt(1), JSBI.BigInt(192))

  if (baseToken < quoteToken) {
    quoteAmount = FullMath.mulDivRoundingUp(ratioX192, baseAmount, shift)
  } else {
    quoteAmount = FullMath.mulDivRoundingUp(shift, baseAmount, ratioX192)
  }

  console.log('quoteAmount', quoteAmount.toString() / (10**18))

  return quoteAmount
}

main(poolContract, 100)
