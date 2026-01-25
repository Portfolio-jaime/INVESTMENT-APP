#!/usr/bin/env python3
"""
TRII Investment Advisor - Herramienta de recomendación de inversión
Analiza acciones en tiempo real y proporciona recomendaciones de trading
"""

import requests
import json
from datetime import datetime
from typing import Dict, List, Tuple

MARKET_DATA_URL = "http://localhost:8001"

STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'AMD', 'META']

def get_quote(symbol: str) -> Dict:
    """Obtiene cotización en tiempo real"""
    try:
        response = requests.get(f"{MARKET_DATA_URL}/api/v1/market-data/quotes/{symbol}")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None

def analyze_stock(quote: Dict) -> Tuple[str, str, float]:
    """
    Analiza una acción y retorna (señal, razón, score)
    Señal: BUY, HOLD, AVOID
    """
    if not quote:
        return "SKIP", "No data", 0

    symbol = quote['symbol']
    price = quote['price']
    change = quote['change']
    change_pct = quote['change_percent']
    volume = quote['volume']

    score = 0
    reasons = []

    # Análisis de momentum
    if change_pct > 2:
        score += 3
        reasons.append(f"+{change_pct:.2f}% fuerte momentum alcista")
    elif change_pct > 0.5:
        score += 2
        reasons.append(f"+{change_pct:.2f}% momentum positivo")
    elif change_pct > 0:
        score += 1
        reasons.append(f"+{change_pct:.2f}% leve alza")
    elif change_pct < -2:
        score -= 3
        reasons.append(f"{change_pct:.2f}% fuerte caída")
    elif change_pct < -0.5:
        score -= 2
        reasons.append(f"{change_pct:.2f}% momentum negativo")
    else:
        score -= 1
        reasons.append(f"{change_pct:.2f}% leve baja")

    # Análisis de volumen (alta actividad es interés)
    if volume > 50_000_000:
        score += 2
        reasons.append(f"Alto volumen ({volume/1_000_000:.1f}M)")
    elif volume > 20_000_000:
        score += 1
        reasons.append(f"Volumen moderado ({volume/1_000_000:.1f}M)")

    # Determinar señal
    if score >= 4:
        signal = "BUY"
    elif score >= 0:
        signal = "HOLD"
    else:
        signal = "AVOID"

    reason = " | ".join(reasons)
    return signal, reason, score

def generate_report():
    """Genera reporte de inversión"""
    print("=" * 80)
    print(" " * 20 + "TRII INVESTMENT ADVISOR")
    print(" " * 25 + "Reporte de Inversión Diario")
    print("=" * 80)
    print(f"\n📅 Fecha y Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # Obtener datos
    print("🔄 Obteniendo datos del mercado...\n")
    stocks_data = []

    for symbol in STOCKS:
        quote = get_quote(symbol)
        if quote:
            signal, reason, score = analyze_stock(quote)
            stocks_data.append({
                'symbol': symbol,
                'quote': quote,
                'signal': signal,
                'reason': reason,
                'score': score
            })

    # Clasificar acciones
    buy_stocks = sorted([s for s in stocks_data if s['signal'] == 'BUY'],
                        key=lambda x: x['score'], reverse=True)
    hold_stocks = sorted([s for s in stocks_data if s['signal'] == 'HOLD'],
                         key=lambda x: x['score'], reverse=True)
    avoid_stocks = sorted([s for s in stocks_data if s['signal'] == 'AVOID'],
                          key=lambda x: x['score'])

    # Imprimir recomendaciones BUY
    print("=" * 80)
    print("🟢 RECOMENDACIONES DE COMPRA (BUY)")
    print("=" * 80)
    if buy_stocks:
        for i, stock in enumerate(buy_stocks[:3], 1):
            q = stock['quote']
            print(f"\n{i}. {q['symbol']} - ${q['price']:.2f}")
            print(f"   Cambio: {'+' if q['change'] >= 0 else ''}{q['change']:.2f} "
                  f"({'+' if q['change_percent'] >= 0 else ''}{q['change_percent']:.2f}%)")
            print(f"   Volumen: {q['volume']:,}")
            print(f"   📊 Score: {stock['score']}/10")
            print(f"   💡 Razón: {stock['reason']}")
    else:
        print("\n   No hay recomendaciones de compra hoy.")

    # Imprimir HOLD
    print("\n" + "=" * 80)
    print("🟡 MANTENER EN CARTERA (HOLD)")
    print("=" * 80)
    if hold_stocks:
        for stock in hold_stocks:
            q = stock['quote']
            print(f"\n• {q['symbol']} - ${q['price']:.2f} "
                  f"({'+' if q['change_percent'] >= 0 else ''}{q['change_percent']:.2f}%)")
            print(f"  {stock['reason']}")
    else:
        print("\n   No hay acciones en categoría HOLD.")

    # Imprimir AVOID
    print("\n" + "=" * 80)
    print("🔴 EVITAR O VENDER (AVOID)")
    print("=" * 80)
    if avoid_stocks:
        for stock in avoid_stocks:
            q = stock['quote']
            print(f"\n• {q['symbol']} - ${q['price']:.2f} "
                  f"({'+' if q['change_percent'] >= 0 else ''}{q['change_percent']:.2f}%)")
            print(f"  ⚠️  {stock['reason']}")
    else:
        print("\n   No hay acciones a evitar.")

    # Resumen ejecutivo
    print("\n" + "=" * 80)
    print("📋 RESUMEN EJECUTIVO")
    print("=" * 80)
    print(f"\n✅ Acciones para COMPRAR HOY: {len(buy_stocks)}")
    if buy_stocks:
        print(f"   👉 Mejor opción: {buy_stocks[0]['symbol']} "
              f"(${buy_stocks[0]['quote']['price']:.2f})")

    print(f"\n⏸️  Acciones para MANTENER: {len(hold_stocks)}")
    print(f"\n⛔ Acciones a EVITAR: {len(avoid_stocks)}")

    print("\n" + "=" * 80)
    print("⚠️  DISCLAIMER: Esta es una herramienta educativa. No constituye")
    print("   asesoría financiera profesional. Consulta con un asesor antes")
    print("   de tomar decisiones de inversión.")
    print("=" * 80)

if __name__ == "__main__":
    try:
        generate_report()
    except KeyboardInterrupt:
        print("\n\n⚠️  Reporte interrumpido por el usuario.")
    except Exception as e:
        print(f"\n❌ Error generando reporte: {e}")
