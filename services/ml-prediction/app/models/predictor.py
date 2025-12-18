"""ML prediction models and logic."""

from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import structlog

logger = structlog.get_logger()


class SimplePredictor:
    """
    Simple ML predictor using linear regression and technical indicators.

    This is a basic implementation focusing on functionality over complexity.
    """

    def __init__(self):
        """Initialize the predictor."""
        self.scaler = StandardScaler()
        self.model = LinearRegression()
        self.logger = logger

    def predict_price(
        self,
        historical_data: List[Dict],
        days_ahead: int = 1
    ) -> Tuple[float, float]:
        """
        Predict future price using linear regression.

        Args:
            historical_data: List of price data dicts with 'date', 'close', 'volume'
            days_ahead: Number of days to predict ahead

        Returns:
            Tuple of (predicted_price, confidence_score)
        """
        if len(historical_data) < 10:
            raise ValueError("Need at least 10 days of data for prediction")

        # Convert to DataFrame
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Prepare features
        df['day_num'] = range(len(df))
        df['sma_5'] = df['close'].rolling(window=5, min_periods=1).mean()
        df['sma_10'] = df['close'].rolling(window=10, min_periods=1).mean()
        df['price_change'] = df['close'].pct_change()

        # Fill NaN values
        df = df.fillna(method='bfill').fillna(method='ffill')

        # Features and target
        X = df[['day_num', 'sma_5', 'sma_10', 'volume']].values
        y = df['close'].values

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Train model
        self.model.fit(X_scaled, y)

        # Calculate model confidence (R² score)
        confidence = max(0.0, min(1.0, self.model.score(X_scaled, y)))

        # Predict next day
        last_day = df.iloc[-1]
        next_day_features = np.array([[
            last_day['day_num'] + days_ahead,
            last_day['sma_5'],
            last_day['sma_10'],
            last_day['volume']
        ]])

        next_day_scaled = self.scaler.transform(next_day_features)
        predicted_price = float(self.model.predict(next_day_scaled)[0])

        # Ensure positive price
        predicted_price = max(0.01, predicted_price)

        self.logger.info(
            "Price prediction completed",
            data_points=len(df),
            confidence=confidence,
            predicted_price=predicted_price
        )

        return predicted_price, confidence

    def predict_signal(
        self,
        current_price: float,
        rsi: Optional[float],
        macd_data: Optional[Dict]
    ) -> Tuple[str, float, float, Dict]:
        """
        Generate buy/sell/hold signal based on technical indicators.

        Args:
            current_price: Current price of the asset
            rsi: RSI indicator value
            macd_data: MACD data with histogram, signal, macd values

        Returns:
            Tuple of (signal, strength, confidence, reasoning)
        """
        signals = []
        reasoning = {}

        # RSI-based signal
        if rsi is not None:
            reasoning['rsi'] = rsi
            if rsi < 30:
                signals.append(('buy', 0.8))
                reasoning['rsi_signal'] = 'oversold'
            elif rsi > 70:
                signals.append(('sell', 0.8))
                reasoning['rsi_signal'] = 'overbought'
            else:
                signals.append(('hold', 0.5))
                reasoning['rsi_signal'] = 'neutral'

        # MACD-based signal
        if macd_data and 'histogram' in macd_data:
            histogram = macd_data.get('histogram', [])
            if len(histogram) >= 2:
                # Check if MACD is crossing signal line
                latest_hist = histogram[-1]
                prev_hist = histogram[-2]

                reasoning['macd_histogram'] = latest_hist

                if latest_hist > 0 and prev_hist <= 0:
                    signals.append(('buy', 0.7))
                    reasoning['macd_trend'] = 'bullish_crossover'
                elif latest_hist < 0 and prev_hist >= 0:
                    signals.append(('sell', 0.7))
                    reasoning['macd_trend'] = 'bearish_crossover'
                elif latest_hist > 0:
                    signals.append(('buy', 0.5))
                    reasoning['macd_trend'] = 'bullish'
                else:
                    signals.append(('sell', 0.5))
                    reasoning['macd_trend'] = 'bearish'

        # Aggregate signals
        if not signals:
            return 'hold', 0.5, 0.5, reasoning

        # Count signals
        buy_signals = [s for s, _ in signals if s == 'buy']
        sell_signals = [s for s, _ in signals if s == 'sell']

        # Calculate average strength
        signal_strengths = [strength for _, strength in signals]
        avg_strength = np.mean(signal_strengths)

        # Determine final signal
        if len(buy_signals) > len(sell_signals):
            final_signal = 'buy'
            confidence = len(buy_signals) / len(signals)
        elif len(sell_signals) > len(buy_signals):
            final_signal = 'sell'
            confidence = len(sell_signals) / len(signals)
        else:
            final_signal = 'hold'
            confidence = 0.5

        self.logger.info(
            "Signal prediction completed",
            signal=final_signal,
            strength=avg_strength,
            confidence=confidence
        )

        return final_signal, float(avg_strength), float(confidence), reasoning

    def predict_trend(
        self,
        historical_data: List[Dict],
        window: int = 3
    ) -> Tuple[str, float, float, Dict]:
        """
        Predict price trend (up/down/neutral) using moving average slope.

        Args:
            historical_data: List of price data dicts
            window: Window for moving average calculation

        Returns:
            Tuple of (trend, trend_strength, confidence, momentum_indicators)
        """
        if len(historical_data) < window:
            raise ValueError(f"Need at least {window} days of data for trend prediction")

        # Convert to DataFrame
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Calculate moving averages
        df['sma_3'] = df['close'].rolling(window=3, min_periods=1).mean()
        df['sma_10'] = df['close'].rolling(window=10, min_periods=1).mean()

        # Get recent data
        recent = df.tail(window)

        # Calculate slope of SMA
        sma_values = recent['sma_3'].values
        x = np.arange(len(sma_values)).reshape(-1, 1)
        lr = LinearRegression()
        lr.fit(x, sma_values)
        slope = lr.coef_[0]

        # Calculate volatility
        returns = df['close'].pct_change().dropna()
        volatility = returns.std() * 100  # As percentage

        # Determine trend
        slope_threshold = 0.001  # Adjust based on price scale

        momentum_indicators = {
            'sma_3': float(recent['sma_3'].iloc[-1]),
            'sma_10': float(df['sma_10'].iloc[-1]) if len(df) >= 10 else None,
            'slope': float(slope),
            'volatility': float(volatility)
        }

        if slope > slope_threshold:
            trend = 'up'
            trend_strength = min(1.0, abs(slope) * 100)
        elif slope < -slope_threshold:
            trend = 'down'
            trend_strength = min(1.0, abs(slope) * 100)
        else:
            trend = 'neutral'
            trend_strength = 0.5

        # Calculate confidence based on consistency of direction
        price_changes = recent['close'].diff().dropna()
        consistent_direction = (
            (price_changes > 0).sum() if slope > 0
            else (price_changes < 0).sum()
        )
        confidence = consistent_direction / len(price_changes) if len(price_changes) > 0 else 0.5

        self.logger.info(
            "Trend prediction completed",
            trend=trend,
            trend_strength=trend_strength,
            confidence=confidence,
            slope=slope
        )

        return trend, float(trend_strength), float(confidence), momentum_indicators


# Singleton instance
predictor = SimplePredictor()
