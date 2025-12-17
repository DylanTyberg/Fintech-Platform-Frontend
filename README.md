# Serverless Financial Market Analysis & Paper Trading Platform

A full-stack fintech application built on AWS serverless architecture, featuring near real-time market data for 8000+ stocks, AI-powered context aware investment recommendations, and paper trading simulation.

🔗 [Live Demo]() | 📹 [Video Demo]() 

## Features

- 📈 **Near Real-time market data** for 8000+ stocks with interactive multi-timeframe charts
- 🤖 **AI-powered investment assistant** using Claude Sonnet 3.5 with portfolio-aware recommendations
- 💰 **Paper trading simulator** with near real-time pricing and portfolio tracking
- ⚡ **Serverless architecture** with automatic scaling and pay-per-execution cost model
- 🎯 **Smart caching strategy** reducing API costs for popular stocks
- 🔐 **Secure authentication** with AWS Cognito and JWT authorization
- 📊 **Portfolio analytics** with daily snapshots and performance tracking

## Architecture
<img width="1801" height="1438" alt="image" src="https://github.com/user-attachments/assets/3008798a-4189-4e26-ba7f-4871316b9414" />

1) Amazon S3  - Static hosting for React Frontend Client

2) API Gateway - REST API with JWT authorization and Lambda proxy integration

3) Amazon Cognito - User authentication with token-based authorization

4) Lambda: Real-Time Data Functions - Direct Polygon.io fetches for immediate user requests

5) Lambda: Market Data Fetchers - Scheduled functions retrieving different data types from 
   Polygon.io (intraday prices, daily OHLC, market movers) and storing in DynamoDB cache 

6) Lambda: Cache Read Functions - Serve stock data from DynamoDB cache 

7) Lambda: Portfolio Updates - Updates DynamoDB to reflext portfolio changes

8) Lambda: Portfolio Query Functions - Aggregate user data endpoints (holdings, positions, 
   transaction history, performance metrics)

9) Lambda: AI Chat Initiator - Creates async Bedrock request and returns polling token to 
   bypass API Gateway 29-second timeout

10) Lambda: AI Polling Handler - Client polls this endpoint to check AI response completion 
    status

11) Lambda: Bedrock Invoker - Executes long-running Claude Sonnet 3.5 with tool-calling 
    architecture for portfolio-aware recommendations

12) Lambda: Portfolio Analytics - Scheduled calculations like portfolio snapshots

13) Lambda: Scheduled Market Updates - EventBridge-triggered functions refreshing cached 
    data for popular/watchlisted stocks across multiple data types

14) DynamoDB: Market Cache - Stores market data from polygon

15) DynamoDB: User Data - Partition key: userId; stores portfolios, holdings, trades, 
    watchlists with optimized sort keys for query patterns

16) EventBridge - Scheduled rules triggering market data updates every 15 minutes during 
    market hours

17) Amazon Bedrock - Claude Sonnet 3.5 with function calling for personalized investment 
    recommendations

18) Polygon.io API - Real-time and historical financial market data provider (stocks, 
    options, forex, crypto)

## Tech Stack

**Frontend**
- React 18 with JavaScript
- LightWeight from TradingView for interactive financial charts
- CSS for styling

**Backend & Infrastructure**
- AWS Lambda (Node.js) - Serverless compute
- AWS API Gateway - REST API
- Amazon DynamoDB - NoSQL database (2 tables)
- Amazon Cognito - User authentication
- Amazon Bedrock - AI integration (Claude Sonnet 3.5)
- Amazon EventBridge - Scheduled data updates
- Amazon S3- Static hosting & CDN

**External APIs**
- Polygon.io - Financial market data


