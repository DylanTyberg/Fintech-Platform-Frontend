import { useState, useEffect } from "react";

// Fetches live price/change data for a list of holdings and derives the
// total portfolio value (holdings value + cash). 
export const useHoldingsPrices = (holdings, cash) => {
    const [priceInfo, setPriceInfo] = useState([]);
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchPrices = async () => {
            if (!holdings || holdings.length === 0) {
                setPriceInfo([]);
                setPortfolioValue(Number(cash) || 0);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/intraday/holdings-prices`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ holdings }),
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                if (cancelled) return;

                setPriceInfo(result);

                const holdingsValue = holdings.reduce((total, holding) => {
                    const info = result.find((item) => item.symbol === holding.symbol);
                    const currentPrice = info?.lastPrice?.close || 0;
                    return total + holding.quantity * currentPrice;
                }, 0);

                setPortfolioValue(holdingsValue + (Number(cash) || 0));
            } catch (error) {
                // console.log(error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchPrices();
        return () => {
            cancelled = true;
        };
    }, [holdings, cash]);

    return { priceInfo, portfolioValue, isLoading };
};