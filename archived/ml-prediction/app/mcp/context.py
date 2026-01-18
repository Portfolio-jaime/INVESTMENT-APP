"""MCP Context and Resource definitions."""

from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class MCPResourceType(str, Enum):
    """Types of MCP resources."""
    MARKET_DATA = "market_data"
    USER_PROFILE = "user_profile"
    PORTFOLIO = "portfolio"
    TECHNICAL_INDICATORS = "technical_indicators"
    FUNDAMENTAL_DATA = "fundamental_data"
    SENTIMENT_DATA = "sentiment_data"
    COLOMBIAN_MARKET = "colombian_market"


class MCPResource(BaseModel):
    """MCP Resource representation."""
    uri: str = Field(..., description="Unique resource identifier")
    name: str = Field(..., description="Human-readable resource name")
    description: str = Field(..., description="Resource description")
    mime_type: str = Field(default="application/json", description="MIME type of resource content")
    resource_type: MCPResourceType = Field(..., description="Type of resource")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class MCPResourceContent(BaseModel):
    """Content of an MCP resource."""
    uri: str = Field(..., description="Resource URI")
    mime_type: str = Field(default="application/json", description="MIME type")
    text: str = Field(..., description="Text content")
    blob: Optional[bytes] = Field(None, description="Binary content if applicable")


class MCPTool(BaseModel):
    """MCP Tool definition."""
    name: str = Field(..., description="Tool name")
    description: str = Field(..., description="Tool description")
    input_schema: Dict[str, Any] = Field(..., description="JSON schema for tool input")


class MCPContext(BaseModel):
    """MCP Context containing resources and tools for LLM processing."""
    session_id: str = Field(..., description="Unique session identifier")
    user_id: Optional[str] = Field(None, description="User identifier if applicable")
    resources: List[MCPResource] = Field(default_factory=list, description="Available resources")
    tools: List[MCPTool] = Field(default_factory=list, description="Available tools")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Context metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Context creation time")
    expires_at: Optional[datetime] = Field(None, description="Context expiration time")


class MCPResponse(BaseModel):
    """Response from MCP model adapter."""
    content: str = Field(..., description="Generated content")
    model_used: str = Field(..., description="Model that generated the response")
    tokens_used: Optional[int] = Field(None, description="Tokens consumed")
    confidence_score: Optional[float] = Field(None, description="Confidence score (0-1)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Response metadata")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="Response generation time")


class MCPRequest(BaseModel):
    """Request to MCP system."""
    prompt: str = Field(..., description="Input prompt")
    context: MCPContext = Field(..., description="MCP context")
    model_preferences: List[str] = Field(default_factory=list, description="Preferred models")
    max_tokens: Optional[int] = Field(None, description="Maximum tokens to generate")
    temperature: Optional[float] = Field(None, description="Sampling temperature")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Request metadata")