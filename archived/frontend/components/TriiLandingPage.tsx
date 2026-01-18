import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  BarChart3,
  Brain,
  PieChart,
  Target,
  DollarSign,
  Play,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';
import './TriiLandingPage.css';

const TriiLandingPage: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Load Albert Sans font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const propuestas = [
    {
      icon: <Brain className="w-12 h-12 text-lavender" />,
      titulo: "Invertir sin saber de finanzas",
      descripcion: "Te guiamos paso a paso. No necesitas ser experto, solo tener ganas de hacer crecer tu dinero de forma inteligente."
    },
    {
      icon: <Target className="w-12 h-12 text-lavender" />,
      titulo: "Recomendaciones inteligentes",
      descripcion: "Nuestra IA analiza tu perfil y objetivos para sugerirte las mejores opciones de inversión personalizadas."
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-lavender" />,
      titulo: "Datos claros y visuales",
      descripcion: "Olvídate de números complicados. Todo se explica con gráficos simples y ejemplos que cualquiera entiende."
    },
    {
      icon: <DollarSign className="w-12 h-12 text-lavender" />,
      titulo: "Inversión desde montos bajos",
      descripcion: "Comienza con tan solo $50.000 COP. No necesitas ser millonario para empezar a invertir y ver resultados."
    }
  ];

  const inversiones = [
    {
      nombre: "Acciones Tecnológicas",
      riesgo: "Alto",
      rentabilidad: "18-25%",
      recomendacion: "Buena opción a largo plazo",
      color: "#FF6B6B",
      grafico: [20, 25, 15, 30, 35, 28, 40]
    },
    {
      nombre: "ETFs Diversificados", 
      riesgo: "Medio",
      rentabilidad: "8-12%",
      recomendacion: "Ideal si estás empezando",
      color: "#4ECDC4",
      grafico: [10, 12, 8, 15, 11, 14, 16]
    },
    {
      nombre: "Fondos de Renta Fija",
      riesgo: "Bajo",
      rentabilidad: "5-7%",
      recomendacion: "Perfecto para ser conservador",
      color: "#95E1D3",
      grafico: [5, 6, 5.5, 7, 6.5, 7.2, 7.8]
    }
  ];

  return (
    <div className="trii-landing">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="nav-brand">
            <h2 className="brand-name">trii</h2>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            <a href="#que-hacemos" className="nav-link">Cómo funciona</a>
            <a href="#inversiones" className="nav-link">Inversiones</a>
            <a href="#empezar" className="nav-link">Empezar</a>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="mobile-nav">
            <a href="#que-hacemos" className="mobile-nav-link">Cómo funciona</a>
            <a href="#inversiones" className="mobile-nav-link">Inversiones</a>
            <a href="#empezar" className="mobile-nav-link">Empezar</a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Invertir puede ser simple
              </h1>
              <h2 className="hero-subtitle">
                trii es la app que hace fácil invertir, incluso si nunca lo has hecho
              </h2>
              <p className="hero-description">
                Te guiamos paso a paso para hacer crecer tu dinero con inversiones inteligentes, 
                sin complicaciones ni lenguaje técnico.
              </p>
              
              <div className="hero-actions">
                <button className="cta-primary">
                  Empieza a invertir
                  <ArrowRight className="btn-icon" />
                </button>
                <button className="cta-secondary">
                  <Play className="btn-icon" />
                  Aprende cómo funciona
                </button>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-cards">
                <div className="hero-card card-1">
                  <div className="card-header">
                    <TrendingUp className="card-icon" />
                    <span className="card-title">Tu portafolio</span>
                  </div>
                  <div className="card-value">+12.5%</div>
                  <div className="card-subtitle">Este mes</div>
                </div>
                
                <div className="hero-card card-2">
                  <div className="card-header">
                    <PieChart className="card-icon" />
                    <span className="card-title">Diversificación</span>
                  </div>
                  <div className="progress-rings">
                    <div className="ring ring-1"></div>
                    <div className="ring ring-2"></div>
                    <div className="ring ring-3"></div>
                  </div>
                </div>

                <div className="hero-card card-3">
                  <div className="card-header">
                    <Shield className="card-icon" />
                    <span className="card-title">Seguridad</span>
                  </div>
                  <div className="security-dots">
                    <div className="dot active"></div>
                    <div className="dot active"></div>
                    <div className="dot active"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Qué hacemos - Propuesta de valor */}
      <section id="que-hacemos" className="propuesta-valor">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">¿Por qué elegir trii?</h2>
            <p className="section-subtitle">
              Hacemos que invertir sea tan fácil como usar tu app favorita
            </p>
          </div>

          <div className="propuestas-grid">
            {propuestas.map((propuesta, index) => (
              <div key={index} className="propuesta-card">
                <div className="propuesta-icon">
                  {propuesta.icon}
                </div>
                <h3 className="propuesta-titulo">{propuesta.titulo}</h3>
                <p className="propuesta-descripcion">{propuesta.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inversiones disponibles */}
      <section id="inversiones" className="inversiones">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Tipos de inversión disponibles</h2>
            <p className="section-subtitle">
              Cada opción está explicada de forma simple. trii te ayuda a elegir según tu perfil y objetivos.
            </p>
          </div>

          <div className="inversiones-grid">
            {inversiones.map((inversion, index) => (
              <div key={index} className="inversion-card">
                <div className="inversion-header">
                  <h3 className="inversion-nombre">{inversion.nombre}</h3>
                  <span className={`riesgo-badge riesgo-${inversion.riesgo.toLowerCase()}`}>
                    Riesgo {inversion.riesgo}
                  </span>
                </div>

                <div className="inversion-rentabilidad">
                  <span className="rentabilidad-label">Rentabilidad estimada anual</span>
                  <span className="rentabilidad-valor">{inversion.rentabilidad}</span>
                </div>

                <div className="inversion-grafico">
                  <svg width="100%" height="80" viewBox="0 0 280 80">
                    <polyline
                      points={inversion.grafico.map((val, i) => `${i * 45},${80 - (val * 2)}`).join(' ')}
                      fill="none"
                      stroke={inversion.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="grafico-line"
                    />
                    {inversion.grafico.map((val, i) => (
                      <circle
                        key={i}
                        cx={i * 45}
                        cy={80 - (val * 2)}
                        r="4"
                        fill={inversion.color}
                        className="grafico-dot"
                      />
                    ))}
                  </svg>
                </div>

                <div className="inversion-recomendacion">
                  <CheckCircle className="check-icon" />
                  <span>{inversion.recomendacion}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="inversiones-footer">
            <p className="footer-text">
              <strong>¿No sabes cuál elegir?</strong> No te preocupes. 
              trii analiza tu situación y te recomienda la mejor combinación para ti.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="empezar" className="cta-final">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Listo para hacer crecer tu dinero</h2>
            <p className="cta-description">
              Únete a miles de colombianos que ya están invirtiendo de forma inteligente con trii
            </p>
            
            <div className="cta-actions">
              <button className="cta-primary large">
                Empieza a invertir gratis
                <ArrowRight className="btn-icon" />
              </button>
            </div>

            <div className="cta-benefits">
              <div className="benefit">
                <CheckCircle className="benefit-icon" />
                <span>Sin comisiones de apertura</span>
              </div>
              <div className="benefit">
                <CheckCircle className="benefit-icon" />
                <span>Soporte 24/7 en español</span>
              </div>
              <div className="benefit">
                <CheckCircle className="benefit-icon" />
                <span>Retira tu dinero cuando quieras</span>
              </div>
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
              <p>Invertir nunca había sido tan simple</p>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h4>Producto</h4>
                <a href="#">Cómo funciona</a>
                <a href="#">Tipos de inversión</a>
                <a href="#">Seguridad</a>
              </div>
              
              <div className="footer-column">
                <h4>Soporte</h4>
                <a href="#">Centro de ayuda</a>
                <a href="#">Contacto</a>
                <a href="#">Blog</a>
              </div>
              
              <div className="footer-column">
                <h4>Legal</h4>
                <a href="#">Términos y condiciones</a>
                <a href="#">Política de privacidad</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2026 trii. Todos los derechos reservados.</p>
            <p className="disclaimer">
              Las inversiones conllevan riesgo de pérdida. Rentabilidades pasadas no garantizan resultados futuros.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TriiLandingPage;