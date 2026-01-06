"""Pydantic schemas for technical indicators."""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class PriceData(BaseModel):
    """Historical price data point."""
    timestamp: datetime
    close: float
    high: Optional[float] = None
    low: Optional[float] = None
    volume: Optional[float] = None


class IndicatorDataPoint(BaseModel):
    """Single indicator data point."""
    timestamp: datetime
    value: float


class SMAResponse(BaseModel):
    """Simple Moving Average response."""
    symbol: str
    period: int
    data: List[IndicatorDataPoint]
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class EMAResponse(BaseModel):
    """Exponential Moving Average response."""
    symbol: str
    period: int
    data: List[IndicatorDataPoint]
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class RSIResponse(BaseModel):
    """Relative Strength Index response."""
    symbol: str
    period: int
    data: List[IndicatorDataPoint]
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class MACDDataPoint(BaseModel):
    """MACD data point with three lines."""
    timestamp: datetime
    macd: float
    signal: float
    histogram: float


class MACDResponse(BaseModel):
    """MACD indicator response."""
    symbol: str
    fast_period: int
    slow_period: int
    signal_period: int
    data: List[MACDDataPoint]
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class BollingerBandsDataPoint(BaseModel):
    """Bollinger Bands data point."""
    timestamp: datetime
    upper: float
    middle: float
    lower: float
    bandwidth: Optional[float] = None


class BollingerBandsResponse(BaseModel):
    """Bollinger Bands response."""
    symbol: str
    period: int
    std_dev: float
    data: List[BollingerBandsDataPoint]
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class AllIndicatorsResponse(BaseModel):
    """Response containing all technical indicators."""
    symbol: str
    sma: SMAResponse
    ema: EMAResponse
    rsi: RSIResponse
    macd: MACDResponse
    bollinger_bands: BollingerBandsResponse
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Error response schema."""
    detail: str
    status_code: int


# Fundamental Analysis Schemas
class FinancialRatios(BaseModel):
    """Financial ratios for fundamental analysis."""
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    roe: Optional[float] = None
    roa: Optional[float] = None
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    quick_ratio: Optional[float] = None
    gross_margin: Optional[float] = None
    net_margin: Optional[float] = None


class FundamentalData(BaseModel):
    """Fundamental analysis data."""
    symbol: str
    market_cap: Optional[float] = None
    revenue: Optional[float] = None
    net_income: Optional[float] = None
    eps: Optional[float] = None
    dividend_yield: Optional[float] = None
    beta: Optional[float] = None
    ratios: FinancialRatios
    last_updated: datetime


class FundamentalResponse(BaseModel):
    """Fundamental analysis response."""
    symbol: str
    data: FundamentalData
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


# Sentiment Analysis Schemas
class SentimentData(BaseModel):
    """Sentiment analysis data point."""
    source: str
    title: str
    sentiment: str  # positive, negative, neutral
    confidence: float
    published_at: datetime


class SentimentSummary(BaseModel):
    """Sentiment analysis summary."""
    symbol: str
    overall_sentiment: str
    average_confidence: float
    positive_count: int
    negative_count: int
    neutral_count: int
    sources_analyzed: int


class SentimentResponse(BaseModel):
    """Sentiment analysis response."""
    symbol: str
    summary: SentimentSummary
    recent_sentiments: List[SentimentData]
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)


# Colombian Market Schemas
class TRMData(BaseModel):
    """TRM (Representative Market Rate) data."""
    date: datetime
    rate: float
    source: str = "Banco de la República"


class TRMImpact(BaseModel):
    """TRM impact analysis."""
    symbol: str
    correlation_coefficient: float
    impact_strength: str  # strong, moderate, weak
    recent_trm_changes: List[TRMData]
    analysis_period_days: int


class BVCPattern(BaseModel):
    """BVC market pattern."""
    pattern_type: str  # bullish, bearish, sideways
    confidence: float
    description: str
    detected_at: datetime
    supporting_indicators: List[str]


class ColombianMarketResponse(BaseModel):
    """Colombian market analysis response."""
    symbol: str
    trm_impact: TRMImpact
    bvc_pattern: BVCPattern
    market_context: str
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)


# LLM Insights Schemas
class LLMInsight(BaseModel):
    """LLM-generated market insight."""
    symbol: str
    insight_type: str  # technical, fundamental, sentiment, combined
    title: str
    summary: str
    detailed_analysis: str
    confidence_level: str  # high, medium, low
    key_factors: List[str]
    recommendation: Optional[str] = None
    generated_at: datetime


class LLMInsightsResponse(BaseModel):
    """LLM insights response."""
    symbol: str
    insights: List[LLMInsight]
    model_used: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# Real-time Analysis Schemas
class RealTimeIndicator(BaseModel):
    """Real-time indicator update."""
    symbol: str
    indicator_type: str
    value: float
    timestamp: datetime
    change_percent: Optional[float] = None


class RealTimeAnalysisResponse(BaseModel):
    """Real-time analysis response."""
    symbol: str
    indicators: List[RealTimeIndicator]
    market_status: str  # open, closed, pre-market, after-hours
    last_update: datetime


# Comprehensive Analysis Response
class ComprehensiveAnalysisResponse(BaseModel):
    """Complete analysis combining all types."""
    symbol: str
    technical: AllIndicatorsResponse
    fundamental: Optional[FundamentalResponse] = None
    sentiment: Optional[SentimentResponse] = None
    colombian_market: Optional[ColombianMarketResponse] = None
    llm_insights: Optional[LLMInsightsResponse] = None
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
