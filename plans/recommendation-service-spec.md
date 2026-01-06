# Enhanced Recommendation Service Architecture Specification

## Overview

This document outlines the technical architecture for enhancing the existing ml-prediction service into a comprehensive recommendation service microservice. The enhancement builds upon the current FastAPI structure while adding advanced LLM capabilities, personalized recommendations, risk assessment, and portfolio optimization features.

## 1. Overall Architecture

### 1.1 Current State Analysis

**Existing ml-prediction Service:**
- FastAPI-based microservice
- Basic ML predictions using scikit-learn (linear regression, trend analysis)
- Simple recommendation engine with multi-factor scoring
- Integration with market-data and analysis-engine services
- No LLM capabilities currently

**Existing analysis-engine Service:**
- Comprehensive market analysis with LLM integration (OpenAI only)
- Technical indicators, fundamental analysis, sentiment analysis
- Colombian market-specific analysis
- LLM insights generation for market analysis

### 1.2 Enhanced Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECOMMENDATION SERVICE                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 API LAYER (FastAPI)                     │   │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────┐  │   │
│  │  │Personalized │   Risk      │ Portfolio   │Colombian│  │   │
│  │  │Recommenda-  │ Assessment  │Optimization │Market   │  │   │
│  │  │   tions     │             │             │Specific │  │   │
│  │  └─────────────┴─────────────┴─────────────┴─────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              HYBRID LLM ENGINE                          │   │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────┐  │   │
│  │  │   OpenAI    │   Ollama    │ Llama.cpp   │  MCP    │  │   │
│  │  │  GPT-4/3.5  │   Models    │   Models    │Protocol │  │   │
│  │  └─────────────┴─────────────┴─────────────┴─────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CORE SERVICES                              │   │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────┐  │   │
│  │  │Data Pipeline│ ML Models   │ Context     │ Caching │  │   │
│  │  │             │ Engine      │ Management  │ Service │  │   │
│  │  └─────────────┴─────────────┴─────────────┴─────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           │          │          │          │
           └──────────┼──────────┼──────────┼──────────┘
                      │          │          │
           ┌──────────┴──────────┴──────────┴──────────┐
           │         EXTERNAL SERVICES                 │
           │  ┌─────────────┬─────────────┬─────────┐  │
           │  │Market Data  │Analysis     │Portfolio│  │
           │  │Service      │Engine       │Manager │  │
           │  └─────────────┴─────────────┴─────────┘  │
           └───────────────────────────────────────────┘
```

### 1.3 Component Breakdown

#### 1.3.1 API Layer
- **Personalized Recommendations API**: User-specific investment suggestions
- **Risk Assessment API**: Portfolio and individual security risk analysis
- **Portfolio Optimization API**: Asset allocation and rebalancing recommendations
- **Colombian Market API**: Local market-specific recommendations

#### 1.3.2 Hybrid LLM Engine
- **OpenAI Integration**: GPT-4/3.5 for complex analysis
- **Ollama Integration**: Local model execution for cost-effective processing
- **Llama.cpp Integration**: High-performance local inference
- **MCP (Model Context Protocol)**: Standardized context management across models

#### 1.3.3 Core Services
- **Data Pipeline Service**: ETL processes for market data integration
- **ML Models Engine**: Advanced prediction models and ensemble methods
- **Context Management**: MCP-based context handling and caching
- **Caching Service**: Redis-based caching for performance optimization

## 2. MCP Integration Design

### 2.1 MCP Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MCP SERVER                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              CONTEXT PROVIDERS                  │   │
│  │  ┌─────────────┬─────────────┬─────────────┐   │   │
│  │  │ Market Data │ User Profile│ Portfolio   │   │   │
│  │  │ Provider    │ Provider    │ Provider    │   │   │
│  │  └─────────────┴─────────────┴─────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │               MODEL ADAPTERS                    │   │
│  │  ┌─────────────┬─────────────┬─────────────┐   │   │
│  │  │ OpenAI      │ Ollama      │ Llama.cpp   │   │   │
│  │  │ Adapter     │ Adapter     │ Adapter     │   │   │
│  │  └─────────────┴─────────────┴─────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Context Providers

#### 2.2.1 Market Data Provider
```python
class MarketDataProvider(MCPResourceProvider):
    async def get_resources(self, symbol: str) -> List[MCPResource]:
        # Fetch real-time and historical data
        # Return structured market context

    async def get_resource_content(self, uri: str) -> MCPResourceContent:
        # Provide detailed market data for LLM consumption
```

#### 2.2.2 User Profile Provider
```python
class UserProfileProvider(MCPResourceProvider):
    async def get_resources(self, user_id: str) -> List[MCPResource]:
        # Risk tolerance, investment goals, preferences
        # Portfolio composition, investment history

    async def get_tools(self, user_id: str) -> List[MCPTool]:
        # Tools for personalized recommendations
```

#### 2.2.3 Portfolio Provider
```python
class PortfolioProvider(MCPResourceProvider):
    async def get_resources(self, portfolio_id: str) -> List[MCPResource]:
        # Current holdings, performance metrics
        # Risk metrics, diversification analysis
```

### 2.3 Model Adapters

#### 2.3.1 OpenAI Adapter
```python
class OpenAIAdapter(MCPModelAdapter):
    async def generate_response(self, context: MCPContext, prompt: str) -> MCPResponse:
        # Use GPT-4 for complex analysis requiring deep reasoning
        # Handle token limits and cost optimization
```

#### 2.3.2 Ollama Adapter
```python
class OllamaAdapter(MCPModelAdapter):
    async def generate_response(self, context: MCPContext, prompt: str) -> MCPResponse:
        # Use local models for cost-effective processing
        # Handle model switching based on task complexity
```

#### 2.3.3 Llama.cpp Adapter
```python
class LlamaCppAdapter(MCPModelAdapter):
    async def generate_response(self, context: MCPContext, prompt: str) -> MCPResponse:
        # High-performance local inference
        # GPU acceleration support
```

## 3. Hybrid LLM Architecture

### 3.1 Model Selection Strategy

```python
class LLMOrchestrator:
    async def select_model(self, task: RecommendationTask) -> LLMModel:
        """
        Select appropriate LLM based on:
        - Task complexity
        - Required reasoning depth
        - Cost constraints
        - Response time requirements
        - Data sensitivity
        """
        if task.complexity == "high" and task.confidentiality == "low":
            return OpenAIModel.GPT4
        elif task.complexity == "medium":
            return OllamaModel.LLAMA2_13B
        else:
            return LlamaCppModel.QUANTIZED_7B
```

### 3.2 Fallback Strategy

```python
class LLMFallbackManager:
    async def execute_with_fallback(self, task: RecommendationTask) -> RecommendationResult:
        models = [
            OpenAIModel.GPT4,
            OllamaModel.LLAMA2_13B,
            LlamaCppModel.QUANTIZED_7B
        ]

        for model in models:
            try:
                result = await model.generate(task)
                return result
            except Exception as e:
                logger.warning(f"Model {model} failed: {e}")
                continue

        raise LLMServiceUnavailableError("All LLM models failed")
```

### 3.3 Context Management

```python
class MCPContextManager:
    async def build_context(self, symbol: str, user_id: str) -> MCPContext:
        """
        Build comprehensive context using MCP providers:
        - Market data and technical indicators
        - User risk profile and preferences
        - Portfolio composition and constraints
        - Colombian market context (if applicable)
        """
```

## 4. Personalized Investment Recommendations Engine

### 4.1 User Profiling System

```python
class UserProfileEngine:
    def __init__(self):
        self.risk_assessment = RiskAssessmentModule()
        self.preference_analyzer = PreferenceAnalyzer()
        self.behavior_tracker = BehaviorTracker()

    async def build_user_profile(self, user_id: str) -> UserProfile:
        risk_tolerance = await self.risk_assessment.calculate_tolerance(user_id)
        preferences = await self.preference_analyzer.analyze_preferences(user_id)
        behavior_patterns = await self.behavior_tracker.analyze_behavior(user_id)

        return UserProfile(
            risk_tolerance=risk_tolerance,
            investment_preferences=preferences,
            behavioral_biases=behavior_patterns
        )
```

### 4.2 Recommendation Generation Pipeline

```python
class PersonalizedRecommendationEngine:
    async def generate_recommendations(self, user_profile: UserProfile, market_context: MarketContext) -> List[Recommendation]:

        # Step 1: Filter eligible securities
        eligible_securities = await self.filter_securities(user_profile, market_context)

        # Step 2: Score securities using multi-factor model
        scored_securities = await self.score_securities(eligible_securities, user_profile)

        # Step 3: Apply behavioral finance adjustments
        adjusted_scores = await self.apply_behavioral_adjustments(scored_securities, user_profile)

        # Step 4: Generate LLM-enhanced recommendations
        recommendations = await self.generate_llm_recommendations(adjusted_scores, user_profile, market_context)

        return recommendations
```

### 4.3 Multi-Factor Scoring Model

```python
class MultiFactorScorer:
    def __init__(self):
        self.factors = {
            'technical': TechnicalFactor(0.25),
            'fundamental': FundamentalFactor(0.30),
            'sentiment': SentimentFactor(0.15),
            'risk': RiskFactor(0.20),
            'momentum': MomentumFactor(0.10)
        }

    async def calculate_score(self, symbol: str, user_profile: UserProfile) -> float:
        scores = {}
        for factor_name, factor in self.factors.items():
            scores[factor_name] = await factor.calculate(symbol, user_profile)

        # Weighted combination
        final_score = sum(scores[factor_name] * factor.weight for factor_name, factor in self.factors.items())

        return self.normalize_score(final_score)
```

## 5. Risk Assessment Module Architecture

### 5.1 Risk Metrics Calculation

```python
class RiskAssessmentModule:
    async def assess_portfolio_risk(self, portfolio: Portfolio) -> RiskMetrics:
        """
        Calculate comprehensive risk metrics:
        - Value at Risk (VaR)
        - Expected Shortfall (ES)
        - Sharpe Ratio
        - Maximum Drawdown
        - Beta relative to market
        - Concentration risk
        """

    async def assess_security_risk(self, symbol: str) -> SecurityRiskMetrics:
        """
        Individual security risk assessment:
        - Volatility measures
        - Liquidity risk
        - Credit risk (for bonds)
        - Country risk (for international investments)
        - ESG risk factors
        """
```

### 5.2 Risk Tolerance Assessment

```python
class RiskToleranceEngine:
    async def assess_risk_tolerance(self, user_id: str) -> RiskTolerance:
        """
        Multi-dimensional risk tolerance assessment:
        - Questionnaire-based assessment
        - Behavioral analysis from trading history
        - Portfolio composition analysis
        - Market condition adjustments
        """
```

### 5.3 Stress Testing

```python
class StressTestingEngine:
    async def run_stress_tests(self, portfolio: Portfolio) -> StressTestResults:
        """
        Scenario analysis:
        - Market crash scenarios
        - Interest rate changes
        - Currency fluctuations
        - Sector-specific shocks
        - Geopolitical events
        """
```

## 6. Portfolio Optimization Suggestions Design

### 6.1 Optimization Engine

```python
class PortfolioOptimizationEngine:
    def __init__(self):
        self.modern_portfolio_theory = MPT_Optimizer()
        self.black_litterman = BlackLittermanOptimizer()
        self.risk_parity = RiskParityOptimizer()

    async def optimize_portfolio(self, current_portfolio: Portfolio, constraints: OptimizationConstraints) -> OptimizationResult:
        """
        Multi-strategy portfolio optimization:
        1. Modern Portfolio Theory (MPT) for efficient frontier
        2. Black-Litterman for incorporating views
        3. Risk Parity for equal risk contribution
        4. Custom constraints handling
        """
```

### 6.2 Rebalancing Recommendations

```python
class RebalancingEngine:
    async def generate_rebalancing_plan(self, portfolio: Portfolio, target_allocation: Dict[str, float]) -> RebalancingPlan:
        """
        Generate rebalancing recommendations:
        - Drift from target allocation
        - Tax implications
        - Transaction costs
        - Market timing considerations
        """
```

### 6.3 Tax Optimization

```python
class TaxOptimizationEngine:
    async def optimize_for_taxes(self, portfolio: Portfolio, tax_situation: TaxProfile) -> TaxOptimizedPortfolio:
        """
        Tax-aware portfolio optimization:
        - Tax-loss harvesting
        - Asset location strategies
        - Holding period optimization
        - Colombian tax regulations
        """
```

## 7. Colombian Market-Specific Recommendations Integration

### 7.1 Local Market Context Provider

```python
class ColombianMarketProvider:
    async def get_colombian_context(self, symbol: str) -> ColombianContext:
        """
        Colombian market-specific factors:
        - TRM (Representative Market Rate) impact
        - BVC (Bogotá Stock Exchange) patterns
        - Local economic indicators
        - Regulatory considerations
        - Currency risk assessment
        """
```

### 7.2 Local Investment Products

```python
class ColombianInvestmentEngine:
    async def analyze_local_instruments(self) -> List[ColombianInstrument]:
        """
        Analysis of Colombian investment products:
        - BVC-listed stocks
        - TES (government bonds)
        - Local ETFs and mutual funds
        - Real estate investment trusts
        """
```

### 7.3 Regulatory Compliance

```python
class ColombianRegulatoryEngine:
    async def check_compliance(self, recommendation: Recommendation, user_profile: UserProfile) -> ComplianceCheck:
        """
        Colombian regulatory compliance:
        - Investor classification (retail vs professional)
        - Concentration limits
        - Foreign investment restrictions
        - Tax reporting requirements
        """
```

## 8. Integration Points with Analysis Engine and Market Data Services

### 8.1 Analysis Engine Integration

```python
class AnalysisEngineClient:
    async def get_technical_analysis(self, symbol: str) -> TechnicalAnalysis:
        # RSI, MACD, Bollinger Bands, etc.

    async def get_fundamental_analysis(self, symbol: str) -> FundamentalAnalysis:
        # P/E, P/B, ROE, etc.

    async def get_sentiment_analysis(self, symbol: str) -> SentimentAnalysis:
        # News sentiment, social media analysis

    async def get_llm_insights(self, symbol: str, context: Dict) -> LLMInsights:
        # AI-powered market insights
```

### 8.2 Market Data Service Integration

```python
class MarketDataClient:
    async def get_real_time_quote(self, symbol: str) -> Quote:
        # Current price, volume, bid/ask

    async def get_historical_data(self, symbol: str, period: str) -> HistoricalData:
        # Price history for analysis

    async def get_currency_data(self, base: str, quote: str) -> CurrencyData:
        # Exchange rates, especially COP/USD

    async def get_broker_data(self, symbol: str) -> BrokerData:
        # Broker-specific market data
```

### 8.3 Service Mesh Integration

```yaml
# Service mesh configuration for inter-service communication
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: recommendation-service
spec:
  http:
  - match:
    - uri:
        prefix: "/api/v1/recommendations"
    route:
    - destination:
        host: recommendation-service
  - match:
    - uri:
        prefix: "/api/v1/analysis"
    route:
    - destination:
        host: analysis-engine
  - match:
    - uri:
        prefix: "/api/v1/market-data"
    route:
    - destination:
        host: market-data-service
```

## 9. API Endpoint Design

### 9.1 Core Recommendation Endpoints

```python
# Personalized Recommendations
@app.get("/api/v1/recommendations/personalized/{user_id}")
async def get_personalized_recommendations(user_id: str, limit: int = 10)

@app.post("/api/v1/recommendations/personalized/{user_id}/feedback")
async def submit_recommendation_feedback(user_id: str, feedback: RecommendationFeedback)

# Risk Assessment
@app.get("/api/v1/risk/assess/portfolio/{portfolio_id}")
async def assess_portfolio_risk(portfolio_id: str)

@app.get("/api/v1/risk/assess/security/{symbol}")
async def assess_security_risk(symbol: str)

# Portfolio Optimization
@app.post("/api/v1/portfolio/{portfolio_id}/optimize")
async def optimize_portfolio(portfolio_id: str, constraints: OptimizationConstraints)

@app.get("/api/v1/portfolio/{portfolio_id}/rebalance")
async def get_rebalancing_recommendations(portfolio_id: str)

# Colombian Market
@app.get("/api/v1/colombian/recommendations")
async def get_colombian_market_recommendations()

@app.get("/api/v1/colombian/instruments")
async def get_colombian_investment_instruments()
```

### 9.2 Advanced Analytics Endpoints

```python
# LLM-Powered Analysis
@app.post("/api/v1/analysis/llm/insights")
async def get_llm_powered_insights(request: LLMInsightsRequest)

@app.post("/api/v1/analysis/llm/compare")
async def compare_llm_models(request: ModelComparisonRequest)

# Batch Processing
@app.post("/api/v1/batch/recommendations")
async def get_batch_recommendations(request: BatchRecommendationRequest)

@app.post("/api/v1/batch/risk-assessment")
async def batch_risk_assessment(request: BatchRiskAssessmentRequest)
```

### 9.3 Administrative Endpoints

```python
# Model Management
@app.get("/api/v1/admin/models/status")
async def get_model_status()

@app.post("/api/v1/admin/models/switch")
async def switch_llm_model(request: ModelSwitchRequest)

# Cache Management
@app.post("/api/v1/admin/cache/clear")
async def clear_cache()

@app.get("/api/v1/admin/cache/stats")
async def get_cache_statistics()
```

## 10. Data Flow and Processing Pipelines

### 10.1 Real-time Data Pipeline

```python
class RealTimeDataPipeline:
    async def process_market_data(self, symbol: str) -> ProcessedData:
        """
        Real-time data processing pipeline:
        1. Ingest raw market data
        2. Apply data validation and cleansing
        3. Calculate real-time indicators
        4. Update recommendation models
        5. Cache processed data
        """
```

### 10.2 Batch Processing Pipeline

```python
class BatchProcessingPipeline:
    async def process_historical_data(self) -> None:
        """
        Batch processing for historical analysis:
        1. Fetch historical market data
        2. Recalculate all technical indicators
        3. Update ML models with new data
        4. Generate batch recommendations
        5. Update user profiles and preferences
        """
```

### 10.3 LLM Processing Pipeline

```python
class LLMProcessingPipeline:
    async def process_llm_request(self, request: LLMRequest) -> LLMResponse:
        """
        LLM processing pipeline:
        1. Build context using MCP
        2. Select appropriate model
        3. Prepare prompt with context
        4. Execute LLM inference
        5. Parse and validate response
        6. Cache response for future use
        """
```

## 11. Scalability and Performance Considerations

### 11.1 Horizontal Scaling

```yaml
# Kubernetes HPA configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: recommendation-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: recommendation-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 11.2 Caching Strategy

```python
class MultiLevelCache:
    def __init__(self):
        self.l1_cache = RedisCache(ttl=300)  # 5 minutes for hot data
        self.l2_cache = RedisCache(ttl=3600)  # 1 hour for warm data
        self.l3_cache = DiskCache(ttl=86400)  # 24 hours for cold data

    async def get(self, key: str) -> Optional[Any]:
        # L1 -> L2 -> L3 cache hierarchy
        # Automatic cache warming for frequently accessed data
```

### 11.3 Database Optimization

```python
class DatabaseOptimizer:
    async def optimize_queries(self):
        """
        Database optimization strategies:
        - Read replicas for analytics queries
        - Partitioning for time-series data
        - Indexing for common query patterns
        - Connection pooling
        - Query result caching
        """
```

### 11.4 LLM Inference Optimization

```python
class LLMInferenceOptimizer:
    async def optimize_inference(self, model: LLMModel, prompt: str) -> OptimizedPrompt:
        """
        LLM optimization techniques:
        - Prompt compression
        - Context pruning
        - Model quantization
        - Batch processing
        - Response caching
        """
```

## 12. Security and Privacy Considerations for LLM Usage

### 12.1 Data Privacy

```python
class DataPrivacyManager:
    async def sanitize_prompt(self, prompt: str, user_context: UserContext) -> SanitizedPrompt:
        """
        Prompt sanitization:
        - Remove PII from prompts
        - Anonymize user data
        - Implement data minimization
        - Ensure GDPR/CCPA compliance
        """

    async def audit_llm_usage(self, request: LLMRequest, response: LLMResponse) -> AuditLog:
        """
        LLM usage auditing:
        - Log all LLM interactions
        - Track data exposure
        - Monitor for sensitive data leakage
        - Implement retention policies
        """
```

### 12.2 Model Security

```python
class ModelSecurityManager:
    async def validate_response(self, response: LLMResponse) -> ValidationResult:
        """
        Response validation:
        - Check for prompt injection attempts
        - Validate response format
        - Detect hallucinated content
        - Implement content filtering
        """

    async def secure_model_access(self, model: LLMModel, user: User) -> AccessToken:
        """
        Secure model access:
        - API key rotation
        - Rate limiting per user/model
        - Access control based on user tier
        - Audit logging for model usage
        """
```

### 12.3 Compliance Framework

```python
class ComplianceFramework:
    async def check_financial_regulation_compliance(self, recommendation: Recommendation) -> ComplianceResult:
        """
        Financial regulation compliance:
        - FINRA regulations
        - SEC guidelines
        - Colombian financial regulations
        - Anti-money laundering checks
        - Know Your Customer (KYC) validation
        """

    async def implement_least_privilege(self, user: User, action: str) -> AuthorizationResult:
        """
        Access control:
        - Role-based access control (RBAC)
        - Attribute-based access control (ABAC)
        - Principle of least privilege
        - Regular permission audits
        """
```

### 12.4 Encryption and Key Management

```python
class EncryptionManager:
    async def encrypt_sensitive_data(self, data: SensitiveData) -> EncryptedData:
        """
        Data encryption:
        - End-to-end encryption for user data
        - Encrypted storage for API keys
        - TLS 1.3 for all communications
        - Key rotation policies
        """

    async def manage_llm_api_keys(self) -> KeyManagementResult:
        """
        LLM API key management:
        - Secure key storage (HashiCorp Vault/AWS KMS)
        - Automatic key rotation
        - Multi-region key replication
        - Emergency key revocation
        """
```

---

This specification provides a comprehensive blueprint for enhancing the ml-prediction service into a world-class recommendation service microservice. The design maintains backward compatibility while adding sophisticated LLM capabilities, personalized recommendations, and advanced portfolio management features.