"""Real-time analysis WebSocket endpoints."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
from typing import Dict, Set
import structlog
from datetime import datetime

from app.services.technical_indicators import indicator_service
from app.services.cache_service import cache_service
from app.core.config import settings

logger = structlog.get_logger()

router = APIRouter()

# Store active WebSocket connections
active_connections: Dict[str, Set[WebSocket]] = {}


class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, symbol: str):
        """Connect a WebSocket for a symbol."""
        await websocket.accept()
        if symbol not in self.active_connections:
            self.active_connections[symbol] = set()
        self.active_connections[symbol].add(websocket)
        logger.info("WebSocket connected", symbol=symbol, total_connections=len(self.active_connections[symbol]))

    def disconnect(self, websocket: WebSocket, symbol: str):
        """Disconnect a WebSocket."""
        if symbol in self.active_connections:
            self.active_connections[symbol].discard(websocket)
            if not self.active_connections[symbol]:
                del self.active_connections[symbol]
            logger.info("WebSocket disconnected", symbol=symbol, remaining_connections=len(self.active_connections.get(symbol, set())))

    async def broadcast_to_symbol(self, symbol: str, message: Dict):
        """Broadcast message to all connections for a symbol."""
        if symbol in self.active_connections:
            disconnected = set()
            for websocket in self.active_connections[symbol]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.warning("Failed to send message to WebSocket", error=str(e))
                    disconnected.add(websocket)

            # Clean up disconnected websockets
            for websocket in disconnected:
                self.active_connections[symbol].discard(websocket)

            if not self.active_connections[symbol]:
                del self.active_connections[symbol]


manager = ConnectionManager()


@router.websocket("/indicators/{symbol}")
async def websocket_indicators(websocket: WebSocket, symbol: str):
    """
    WebSocket endpoint for real-time technical indicators.

    Sends updated indicator values at regular intervals.
    """
    await manager.connect(websocket, symbol)

    try:
        # Send initial data
        await send_initial_indicators(websocket, symbol)

        # Send periodic updates
        while True:
            await asyncio.sleep(settings.REAL_TIME_UPDATE_INTERVAL)
            await send_indicator_update(websocket, symbol)

    except WebSocketDisconnect:
        manager.disconnect(websocket, symbol)
    except Exception as e:
        logger.error("WebSocket error", symbol=symbol, error=str(e))
        manager.disconnect(websocket, symbol)


async def send_initial_indicators(websocket: WebSocket, symbol: str):
    """Send initial indicator data."""
    try:
        # Get all indicators
        indicators = await indicator_service.calculate_all_indicators(symbol.upper())

        message = {
            "type": "initial_data",
            "symbol": symbol.upper(),
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "sma": {
                    "period": indicators.sma.period,
                    "latest_value": indicators.sma.data[-1].value if indicators.sma.data else None
                },
                "ema": {
                    "period": indicators.ema.period,
                    "latest_value": indicators.ema.data[-1].value if indicators.ema.data else None
                },
                "rsi": {
                    "period": indicators.rsi.period,
                    "latest_value": indicators.rsi.data[-1].value if indicators.rsi.data else None
                },
                "macd": {
                    "fast_period": indicators.macd.fast_period,
                    "slow_period": indicators.macd.slow_period,
                    "signal_period": indicators.macd.signal_period,
                    "latest_macd": indicators.macd.data[-1].macd if indicators.macd.data else None,
                    "latest_signal": indicators.macd.data[-1].signal if indicators.macd.data else None,
                    "latest_histogram": indicators.macd.data[-1].histogram if indicators.macd.data else None
                },
                "bollinger_bands": {
                    "period": indicators.bollinger_bands.period,
                    "std_dev": indicators.bollinger_bands.std_dev,
                    "latest_upper": indicators.bollinger_bands.data[-1].upper if indicators.bollinger_bands.data else None,
                    "latest_middle": indicators.bollinger_bands.data[-1].middle if indicators.bollinger_bands.data else None,
                    "latest_lower": indicators.bollinger_bands.data[-1].lower if indicators.bollinger_bands.data else None
                }
            }
        }

        await websocket.send_json(message)

    except Exception as e:
        logger.error("Error sending initial indicators", symbol=symbol, error=str(e))


async def send_indicator_update(websocket: WebSocket, symbol: str):
    """Send periodic indicator updates."""
    try:
        # In a real implementation, this would check for new market data
        # and recalculate indicators only if data has changed

        # For now, just send a heartbeat with current timestamp
        message = {
            "type": "update",
            "symbol": symbol.upper(),
            "timestamp": datetime.utcnow().isoformat(),
            "status": "active"
        }

        await websocket.send_json(message)

    except Exception as e:
        logger.error("Error sending indicator update", symbol=symbol, error=str(e))


@router.websocket("/market-status")
async def websocket_market_status(websocket: WebSocket):
    """
    WebSocket endpoint for market status updates.

    Sends Colombian market status and TRM updates.
    """
    await websocket.accept()

    try:
        while True:
            await asyncio.sleep(300)  # Update every 5 minutes

            # Get market status (simplified)
            market_status = {
                "type": "market_status",
                "timestamp": datetime.utcnow().isoformat(),
                "colombian_market": {
                    "status": "open",  # This would be determined by market hours
                    "next_update": (datetime.utcnow().timestamp() + 300) * 1000  # milliseconds
                }
            }

            await websocket.send_json(market_status)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("Market status WebSocket error", error=str(e))