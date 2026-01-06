"""Fundamental analysis service."""

import yfinance as yf
from alpha_vantage.fundamentaldata import FundamentalData
import httpx
from typing import Optional, Dict, Any
from datetime import datetime
import structlog

from app.core.config import settings
from app.schemas.indicators import (
    FundamentalData as FundamentalDataSchema,
    FinancialRatios,
    FundamentalResponse
)

logger = structlog.get_logger()


class FundamentalAnalysisService:
    """Service for fundamental analysis of stocks."""

    def __init__(self):
        """Initialize the service."""
        self.alpha_vantage_key = settings.ALPHA_VANTAGE_API_KEY
        if self.alpha_vantage_key:
            self.fd = FundamentalData(key=self.alpha_vantage_key, output_format='pandas')

    async def get_fundamental_data(self, symbol: str) -> FundamentalResponse:
        """
        Get comprehensive fundamental data for a symbol.

        Args:
            symbol: Stock symbol

        Returns:
            FundamentalResponse with financial data and ratios
        """
        try:
            logger.info("Fetching fundamental data", symbol=symbol)

            # Get data from Yahoo Finance
            ticker = yf.Ticker(symbol)

            # Get basic info
            info = ticker.info

            # Calculate financial ratios
            ratios = await self._calculate_ratios(ticker, info)

            # Create fundamental data object
            fundamental_data = FundamentalDataSchema(
                symbol=symbol.upper(),
                market_cap=info.get('marketCap'),
                revenue=info.get('totalRevenue'),
                net_income=info.get('netIncome'),
                eps=info.get('trailingEps'),
                dividend_yield=info.get('dividendYield'),
                beta=info.get('beta'),
                ratios=ratios,
                last_updated=datetime.utcnow()
            )

            return FundamentalResponse(
                symbol=symbol.upper(),
                data=fundamental_data
            )

        except Exception as e:
            logger.error("Error fetching fundamental data", symbol=symbol, error=str(e))
            raise ValueError(f"Failed to fetch fundamental data for {symbol}: {str(e)}")

    async def _calculate_ratios(self, ticker: yf.Ticker, info: Dict[str, Any]) -> FinancialRatios:
        """
        Calculate financial ratios from ticker data.

        Args:
            ticker: Yahoo Finance ticker object
            info: Ticker info dictionary

        Returns:
            FinancialRatios object
        """
        try:
            # Get financial statements
            balance_sheet = ticker.balance_sheet
            income_stmt = ticker.income_stmt
            cash_flow = ticker.cashflow

            ratios = FinancialRatios()

            # Price ratios
            ratios.pe_ratio = info.get('trailingPE')
            ratios.pb_ratio = info.get('priceToBook')

            # Profitability ratios
            if not income_stmt.empty and not balance_sheet.empty:
                try:
                    # ROE = Net Income / Shareholder's Equity
                    net_income = income_stmt.loc['Net Income'].iloc[0] if 'Net Income' in income_stmt.index else None
                    equity = balance_sheet.loc['Total Stockholder Equity'].iloc[0] if 'Total Stockholder Equity' in balance_sheet.index else None
                    if net_income and equity and equity != 0:
                        ratios.roe = net_income / equity

                    # ROA = Net Income / Total Assets
                    total_assets = balance_sheet.loc['Total Assets'].iloc[0] if 'Total Assets' in balance_sheet.index else None
                    if net_income and total_assets and total_assets != 0:
                        ratios.roa = net_income / total_assets

                    # Debt to Equity = Total Debt / Shareholder's Equity
                    total_debt = balance_sheet.loc['Total Debt'].iloc[0] if 'Total Debt' in balance_sheet.index else None
                    if total_debt and equity and equity != 0:
                        ratios.debt_to_equity = total_debt / equity

                    # Current Ratio = Current Assets / Current Liabilities
                    current_assets = balance_sheet.loc['Total Current Assets'].iloc[0] if 'Total Current Assets' in balance_sheet.index else None
                    current_liabilities = balance_sheet.loc['Total Current Liabilities'].iloc[0] if 'Total Current Liabilities' in balance_sheet.index else None
                    if current_assets and current_liabilities and current_liabilities != 0:
                        ratios.current_ratio = current_assets / current_liabilities

                    # Quick Ratio = (Current Assets - Inventory) / Current Liabilities
                    inventory = balance_sheet.loc['Inventory'].iloc[0] if 'Inventory' in balance_sheet.index else 0
                    if current_assets and current_liabilities and current_liabilities != 0:
                        ratios.quick_ratio = (current_assets - inventory) / current_liabilities

                    # Gross Margin = Gross Profit / Revenue
                    gross_profit = income_stmt.loc['Gross Profit'].iloc[0] if 'Gross Profit' in income_stmt.index else None
                    revenue = income_stmt.loc['Total Revenue'].iloc[0] if 'Total Revenue' in income_stmt.index else None
                    if gross_profit and revenue and revenue != 0:
                        ratios.gross_margin = gross_profit / revenue

                    # Net Margin = Net Income / Revenue
                    if net_income and revenue and revenue != 0:
                        ratios.net_margin = net_income / revenue

                except (KeyError, IndexError, TypeError) as e:
                    logger.warning("Error calculating some ratios", symbol=ticker.ticker, error=str(e))

            return ratios

        except Exception as e:
            logger.error("Error calculating ratios", symbol=ticker.ticker, error=str(e))
            return FinancialRatios()

    async def get_income_statement(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get income statement data."""
        try:
            if not self.alpha_vantage_key:
                ticker = yf.Ticker(symbol)
                return ticker.income_stmt.to_dict()

            # Use Alpha Vantage for more detailed data
            data, _ = self.fd.get_income_statement_annual(symbol)
            return data.to_dict() if not data.empty else None

        except Exception as e:
            logger.error("Error fetching income statement", symbol=symbol, error=str(e))
            return None

    async def get_balance_sheet(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get balance sheet data."""
        try:
            if not self.alpha_vantage_key:
                ticker = yf.Ticker(symbol)
                return ticker.balance_sheet.to_dict()

            # Use Alpha Vantage for more detailed data
            data, _ = self.fd.get_balance_sheet_annual(symbol)
            return data.to_dict() if not data.empty else None

        except Exception as e:
            logger.error("Error fetching balance sheet", symbol=symbol, error=str(e))
            return None

    async def get_cash_flow(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get cash flow statement data."""
        try:
            if not self.alpha_vantage_key:
                ticker = yf.Ticker(symbol)
                return ticker.cashflow.to_dict()

            # Use Alpha Vantage for more detailed data
            data, _ = self.fd.get_cash_flow_annual(symbol)
            return data.to_dict() if not data.empty else None

        except Exception as e:
            logger.error("Error fetching cash flow", symbol=symbol, error=str(e))
            return None


# Singleton instance
fundamental_service = FundamentalAnalysisService()