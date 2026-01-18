"""Multi-factor scoring algorithm for investment recommendations."""

from typing import Dict, List, Tuple, Optional
import numpy as np
import structlog

logger = structlog.get_logger()


class ScoreCalculator:
    """
    Advanced multi-factor scoring algorithm for stock recommendations.

    Weights:
    - Momentum Analysis: 40%
    - Volume Analysis: 20%
    - RSI Analysis: 20%
    - MACD Analysis: 20%
    """

    def __init__(self):
        """Initialize the score calculator."""
        self.logger = logger
        self.weights = {
            'momentum': 0.40,
            'volume': 0.20,
            'rsi': 0.20,
            'macd': 0.20
        }

    def calculate_momentum_score(
        self,
        historical_data: List[Dict],
        current_price: float
    ) -> Tuple[float, List[str]]:
        """
        Calculate momentum-based score.

        Args:
            historical_data: List of historical price data
            current_price: Current stock price

        Returns:
            Tuple of (score, reasons)
        """
        score = 0.0
        reasons = []

        if not historical_data or len(historical_data) < 2:
            return score, ["Insufficient data for momentum analysis"]

        # Calculate price change percentage
        prev_close = historical_data[-1].get('close', current_price)
        change_pct = ((current_price - prev_close) / prev_close) * 100 if prev_close > 0 else 0

        # Calculate velocity (rate of change)
        if len(historical_data) >= 5:
            prices = [d.get('close', 0) for d in historical_data[-5:]]
            velocity = np.mean(np.diff(prices))
        else:
            velocity = change_pct

        # Calculate acceleration
        if len(historical_data) >= 10:
            prices = [d.get('close', 0) for d in historical_data[-10:]]
            velocities = np.diff(prices)
            acceleration = np.mean(np.diff(velocities)) if len(velocities) > 1 else 0
        else:
            acceleration = 0

        # Strong bullish momentum
        if change_pct > 3:
            score += 4.0
            reasons.append(f"+{change_pct:.2f}% strong bullish momentum")
        elif change_pct > 1.5:
            score += 3.0
            reasons.append(f"+{change_pct:.2f}% bullish momentum")
        elif change_pct > 0.5:
            score += 2.0
            reasons.append(f"+{change_pct:.2f}% positive momentum")
        # Strong bearish momentum
        elif change_pct < -3:
            score -= 4.0
            reasons.append(f"{change_pct:.2f}% strong bearish momentum")
        elif change_pct < -1.5:
            score -= 3.0
            reasons.append(f"{change_pct:.2f}% bearish momentum")
        elif change_pct < -0.5:
            score -= 2.0
            reasons.append(f"{change_pct:.2f}% negative momentum")
        else:
            reasons.append(f"{change_pct:+.2f}% neutral momentum")

        # Acceleration bonus
        if acceleration > 0 and change_pct > 0:
            score += 1.0
            reasons.append("Positive acceleration detected")
        elif acceleration < 0 and change_pct < 0:
            score -= 1.0
            reasons.append("Negative acceleration detected")

        # Apply momentum weight
        weighted_score = score * self.weights['momentum'] * 10

        return weighted_score, reasons

    def calculate_volume_score(
        self,
        historical_data: List[Dict],
        current_volume: int
    ) -> Tuple[float, List[str]]:
        """
        Calculate volume-based score.

        Args:
            historical_data: List of historical price data
            current_volume: Current trading volume

        Returns:
            Tuple of (score, reasons)
        """
        score = 0.0
        reasons = []

        if not historical_data or len(historical_data) < 20:
            return score, ["Insufficient data for volume analysis"]

        # Calculate average volume (20-day)
        volumes = [d.get('volume', 0) for d in historical_data[-20:]]
        avg_volume = np.mean(volumes)

        if avg_volume == 0:
            return score, ["No volume data available"]

        volume_ratio = current_volume / avg_volume

        # High volume signals
        if volume_ratio > 2.0:
            score += 2.0
            reasons.append(f"Very high volume ({current_volume/1_000_000:.1f}M, +{(volume_ratio-1)*100:.0f}% vs avg)")
        elif volume_ratio > 1.5:
            score += 1.5
            reasons.append(f"High volume ({current_volume/1_000_000:.1f}M, +{(volume_ratio-1)*100:.0f}% vs avg)")
        elif volume_ratio > 1.2:
            score += 1.0
            reasons.append(f"Above-average volume ({current_volume/1_000_000:.1f}M)")
        elif volume_ratio < 0.5:
            score -= 0.5
            reasons.append(f"Low volume ({current_volume/1_000_000:.1f}M, below average)")
        else:
            reasons.append(f"Average volume ({current_volume/1_000_000:.1f}M)")

        # Volume trend
        if len(volumes) >= 5:
            recent_avg = np.mean(volumes[-5:])
            older_avg = np.mean(volumes[-20:-5])
            if recent_avg > older_avg * 1.3:
                score += 0.5
                reasons.append("Increasing volume trend")

        # Apply volume weight
        weighted_score = score * self.weights['volume'] * 10

        return weighted_score, reasons

    def calculate_rsi_score(
        self,
        rsi: Optional[float]
    ) -> Tuple[float, List[str]]:
        """
        Calculate RSI-based score.

        Args:
            rsi: RSI indicator value (0-100)

        Returns:
            Tuple of (score, reasons)
        """
        score = 0.0
        reasons = []

        if rsi is None:
            return score, ["RSI data not available"]

        # Oversold territory (strong buy signal)
        if rsi < 20:
            score += 2.5
            reasons.append(f"RSI {rsi:.1f} (extremely oversold - strong buy)")
        elif rsi < 30:
            score += 2.0
            reasons.append(f"RSI {rsi:.1f} (oversold)")
        elif rsi < 40:
            score += 1.0
            reasons.append(f"RSI {rsi:.1f} (slightly oversold)")
        # Overbought territory (strong sell signal)
        elif rsi > 80:
            score -= 2.5
            reasons.append(f"RSI {rsi:.1f} (extremely overbought - strong sell)")
        elif rsi > 70:
            score -= 2.0
            reasons.append(f"RSI {rsi:.1f} (overbought)")
        elif rsi > 60:
            score -= 1.0
            reasons.append(f"RSI {rsi:.1f} (slightly overbought)")
        # Neutral zone
        else:
            reasons.append(f"RSI {rsi:.1f} (neutral zone)")

        # Apply RSI weight
        weighted_score = score * self.weights['rsi'] * 10

        return weighted_score, reasons

    def calculate_macd_score(
        self,
        macd_data: Optional[Dict]
    ) -> Tuple[float, List[str]]:
        """
        Calculate MACD-based score.

        Args:
            macd_data: MACD data with histogram, signal, macd values

        Returns:
            Tuple of (score, reasons)
        """
        score = 0.0
        reasons = []

        if not macd_data or 'histogram' not in macd_data:
            return score, ["MACD data not available"]

        histogram = macd_data.get('histogram', [])
        macd_line = macd_data.get('macd', [])
        signal_line = macd_data.get('signal', [])

        if len(histogram) < 2:
            return score, ["Insufficient MACD history"]

        hist_latest = histogram[-1]
        hist_prev = histogram[-2]

        # Bullish crossover (MACD crosses above signal line)
        if hist_latest > 0 and hist_prev <= 0:
            score += 2.5
            reasons.append("MACD bullish crossover (strong buy signal)")
        # Bearish crossover (MACD crosses below signal line)
        elif hist_latest < 0 and hist_prev >= 0:
            score -= 2.5
            reasons.append("MACD bearish crossover (strong sell signal)")
        # Continuing bullish trend
        elif hist_latest > 0:
            if hist_latest > hist_prev:
                score += 1.5
                reasons.append("MACD bullish trend strengthening")
            else:
                score += 1.0
                reasons.append("MACD bullish trend")
        # Continuing bearish trend
        elif hist_latest < 0:
            if hist_latest < hist_prev:
                score -= 1.5
                reasons.append("MACD bearish trend strengthening")
            else:
                score -= 1.0
                reasons.append("MACD bearish trend")

        # Divergence detection (if MACD and signal line data available)
        if len(macd_line) >= 5 and len(signal_line) >= 5:
            macd_trend = macd_line[-1] - macd_line[-5]
            if abs(macd_trend) > 0.5:
                if macd_trend > 0 and hist_latest > 0:
                    score += 0.5
                    reasons.append("MACD showing strong bullish divergence")
                elif macd_trend < 0 and hist_latest < 0:
                    score -= 0.5
                    reasons.append("MACD showing strong bearish divergence")

        # Apply MACD weight
        weighted_score = score * self.weights['macd'] * 10

        return weighted_score, reasons

    def calculate_comprehensive_score(
        self,
        historical_data: List[Dict],
        current_price: float,
        current_volume: int,
        rsi: Optional[float],
        macd_data: Optional[Dict]
    ) -> Tuple[str, float, float, List[str]]:
        """
        Calculate comprehensive recommendation score using all factors.

        Args:
            historical_data: List of historical price data
            current_price: Current stock price
            current_volume: Current trading volume
            rsi: RSI indicator value
            macd_data: MACD data

        Returns:
            Tuple of (signal, score, confidence, reasons)
        """
        all_reasons = []
        total_score = 0.0

        # Calculate individual scores
        momentum_score, momentum_reasons = self.calculate_momentum_score(historical_data, current_price)
        volume_score, volume_reasons = self.calculate_volume_score(historical_data, current_volume)
        rsi_score, rsi_reasons = self.calculate_rsi_score(rsi)
        macd_score, macd_reasons = self.calculate_macd_score(macd_data)

        # Combine scores
        total_score = momentum_score + volume_score + rsi_score + macd_score

        # Combine reasons
        all_reasons.extend(momentum_reasons)
        all_reasons.extend(volume_reasons)
        all_reasons.extend(rsi_reasons)
        all_reasons.extend(macd_reasons)

        # Determine signal based on score
        if total_score >= 5:
            signal = "BUY"
            confidence = min(95, 60 + total_score * 5)
        elif total_score >= -1:
            signal = "HOLD"
            confidence = 50 + abs(total_score) * 3
        else:
            signal = "AVOID"
            confidence = min(95, 60 + abs(total_score) * 5)

        # Normalize score to -10 to +10 range
        normalized_score = max(-10, min(10, total_score))

        self.logger.info(
            "Comprehensive score calculated",
            signal=signal,
            score=normalized_score,
            confidence=confidence,
            momentum=momentum_score,
            volume=volume_score,
            rsi=rsi_score,
            macd=macd_score
        )

        return signal, float(normalized_score), float(confidence), all_reasons


# Singleton instance
score_calculator = ScoreCalculator()
