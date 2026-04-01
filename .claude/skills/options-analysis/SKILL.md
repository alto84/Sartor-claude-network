---
name: options-analysis
description: Analyze a specific options position with Greeks, scenarios, and comparative strikes
model: sonnet
---

Analyze the specified options position. The user will provide: ticker, position type (call/put), strike, expiration, current underlying price, and premium paid/received.

## Step 1 — Greeks Calculation
Calculate the following Greeks for the current position:
- **Delta**: sensitivity to underlying price movement (0 to 1 for calls, -1 to 0 for puts)
- **Theta**: daily time decay in dollars
- **Gamma**: rate of change of delta per $1 move in underlying
- **Vega**: sensitivity to 1% change in implied volatility

Use Black-Scholes model. State assumptions (IV, risk-free rate used).

## Step 2 — Scenario Modeling
Model 3 scenarios at expiration:
1. **Flat**: underlying price unchanged from current
2. **Up past strike**: underlying 10% above current price
3. **Down**: underlying 10% below current price

For each scenario: P&L in dollars and percentage of premium, position status (ITM/OTM/ATM).

## Step 3 — Key Metrics
- Maximum gain (and conditions required)
- Maximum loss (and conditions required)
- Breakeven price(s)
- Days to expiration

## Step 4 — Alternative Strikes/Expirations
Compare 2 alternative strikes (one higher, one lower) and 2 alternative expirations (shorter, longer) for the same directional thesis. For each alternative: premium, breakeven, max gain, max loss, key tradeoff vs current position.

## Step 5 — Output
Save to: `reports/financial/{date}-{ticker}-analysis.md`

Format:
```
# Options Analysis: {ticker} {type} ${strike} exp {expiration}
Date: {date}
Underlying Price: ${price}

## Greeks
...

## Scenarios at Expiration
...

## Key Metrics
...

## Alternative Positions
...

## Notes
[State assumptions, data sources, limitations]
```

No recommendations. Present data only. State all assumptions clearly.
