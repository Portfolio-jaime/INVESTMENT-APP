import React, { useEffect } from 'react';
import { initLandingPageInteractions, formatCurrency, calculateInvestmentReturn } from './LandingPageUtils';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  useEffect(() => {
    const cleanup = initLandingPageInteractions();
    return cleanup;
  }, []);

  // Example calculation for demonstration
  const exampleCalculation = calculateInvestmentReturn(50000, 100000, 8, 5);

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <h2>trii</h2>
          </div>
          <nav className="nav">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#inversiones">Inversiones</a>
            <a href="#empezar" className="btn-primary">Empezar</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Invertir puede ser <span className="highlight">simple</span>
            </h1>
            <h2 className="hero-subtitle">
              trii es tu compañero inteligente para hacer crecer tu dinero sin complicaciones
            </h2>
            <p className="hero-description">
              Te ayudamos a invertir desde $50.000 con recomendaciones personalizadas y gráficos claros que cualquiera puede entender.
            </p>
            <div className="hero-actions">
              <button className="btn-primary-large">
                Empieza a invertir
              </button>
              <button className="btn-secondary-large">
                Aprende cómo funciona
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="app-mockup">
              <div className="phone-frame">
                <div className="screen">
                  <div className="mock-chart">
                    <div className="chart-line"></div>
                    <div className="chart-bars">
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                    </div>
                  </div>
                  <div className="mock-cards">
                    <div className="mock-card">
                      <span className="trend-up">+12.5%</span>
                    </div>
                    <div className="mock-card">
                      <span className="trend-up">+8.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Propuesta de Valor */}
      <section className="value-proposition" id="como-funciona">
        <div className="container">
          <h2 className="section-title">¿Por qué elegir trii?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </div>
              <h3>Inversión sin complicaciones</h3>
              <p>No necesitas ser experto. Te explicamos todo con palabras simples y ejemplos del día a día.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11H15M9 15H15M4 19.5V8A2.5 2.5 0 0 1 6.5 5.5H9.5A2.5 2.5 0 0 1 12 3A2.5 2.5 0 0 1 14.5 5.5H17.5A2.5 2.5 0 0 1 20 8V19.5L12 15L4 19.5Z"/>
                </svg>
              </div>
              <h3>Recomendaciones inteligentes</h3>
              <p>Nuestro algoritmo analiza el mercado colombiano y te sugiere las mejores opciones para tu perfil.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3V21H21V3H3ZM8 17L5 14L6.41 12.59L8 14.17L11.59 10.58L13 12L8 17Z"/>
                </svg>
              </div>
              <h3>Datos claros y visuales</h3>
              <p>Gráficos fáciles de leer, números grandes y colores que te ayudan a entender cómo va tu dinero.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1V23M17 5H9.5A3.5 3.5 0 0 0 9.5 12H17A3.5 3.5 0 0 1 17 19H6"/>
                </svg>
              </div>
              <h3>Desde montos pequeños</h3>
              <p>Comienza con tan solo $50.000 y ve creciendo tu portafolio mes a mes a tu ritmo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Inversiones Disponibles */}
      <section className="investments" id="inversiones">
        <div className="container">
          <h2 className="section-title">Opciones de inversión disponibles</h2>
          <p className="section-subtitle">Cada opción está diseñada para diferentes objetivos. Te ayudamos a elegir la mejor para ti.</p>
          
          <div className="investments-grid">
            <div className="investment-card">
              <div className="investment-header">
                <h3>Acciones Colombianas</h3>
                <span className="risk-badge risk-medium">Riesgo Medio</span>
              </div>
              <div className="investment-returns">
                <span className="return-number">8-15%</span>
                <span className="return-label">anual estimado</span>
              </div>
              <div className="investment-chart">
                <div className="mini-chart">
                  <div className="chart-line-up"></div>
                </div>
              </div>
              <p className="investment-description">
                Invierte en las mejores empresas colombianas como Ecopetrol, Bancolombia y Grupo Éxito.
              </p>
              <div className="investment-recommendation">
                ✨ <strong>Ideal si:</strong> Quieres apoyar empresas que conoces y confías en el crecimiento de Colombia.
              </div>
            </div>

            <div className="investment-card featured">
              <div className="investment-header">
                <h3>ETFs Diversificados</h3>
                <span className="risk-badge risk-low">Riesgo Bajo</span>
              </div>
              <div className="investment-returns">
                <span className="return-number">5-10%</span>
                <span className="return-label">anual estimado</span>
              </div>
              <div className="investment-chart">
                <div className="mini-chart">
                  <div className="chart-line-steady"></div>
                </div>
              </div>
              <p className="investment-description">
                Una canasta con cientos de acciones internacionales. Menos riesgo, crecimiento constante.
              </p>
              <div className="investment-recommendation">
                ⭐ <strong>Recomendado para principiantes:</strong> La opción más segura para empezar a invertir.
              </div>
            </div>

            <div className="investment-card">
              <div className="investment-header">
                <h3>Fondos de Inversión</h3>
                <span className="risk-badge risk-low">Riesgo Bajo</span>
              </div>
              <div className="investment-returns">
                <span className="return-number">4-8%</span>
                <span className="return-label">anual estimado</span>
              </div>
              <div className="investment-chart">
                <div className="mini-chart">
                  <div className="chart-line-steady"></div>
                </div>
              </div>
              <p className="investment-description">
                Profesionales expertos manejan tu dinero junto con el de otros inversionistas.
              </p>
              <div className="investment-recommendation">
                🛡️ <strong>Buena opción a largo plazo:</strong> Para objetivos como la pensión o la educación de tus hijos.
              </div>
            </div>
          </div>

          <div className="cta-section">
            <div className="cta-content">
              <h3>¿No sabes cuál elegir?</h3>
              <p>trii te guía paso a paso. Responde unas preguntas simples y te recomendamos la mejor opción.</p>
              <button className="btn-primary">Encuentra tu inversión ideal</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>trii</h3>
              <p>Inversiones simples para colombianos</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Producto</h4>
                <a href="#">Cómo funciona</a>
                <a href="#">Precios</a>
                <a href="#">Seguridad</a>
              </div>
              <div className="footer-col">
                <h4>Soporte</h4>
                <a href="#">Centro de ayuda</a>
                <a href="#">Contacto</a>
                <a href="#">WhatsApp</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 trii. Inversiones vigiladas por la Superintendencia Financiera de Colombia.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;