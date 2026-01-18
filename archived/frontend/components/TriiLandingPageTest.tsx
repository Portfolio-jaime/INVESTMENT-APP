import React from 'react';
import { ArrowRight, TrendingUp, Shield, Brain } from 'lucide-react';

const TriiLandingPageTest: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #C7E0FF 0%, #A9A0EC 100%)',
      fontFamily: 'Albert Sans, sans-serif',
      color: '#333'
    }}>
      {/* Header */}
      <header style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        background: 'rgba(255,255,255,0.95)', 
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        padding: '1rem 2rem',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#A9A0EC', margin: 0 }}>trii</h1>
          <nav style={{ display: 'flex', gap: '2rem' }}>
            <a href="#como-funciona" style={{ color: '#4B5563', textDecoration: 'none', fontWeight: 500 }}>Cómo funciona</a>
            <a href="#inversiones" style={{ color: '#4B5563', textDecoration: 'none', fontWeight: 500 }}>Inversiones</a>
            <a href="#empezar" style={{ color: '#4B5563', textDecoration: 'none', fontWeight: 500 }}>Empezar</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ 
        padding: '8rem 2rem 6rem', 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4rem',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: 800, 
            lineHeight: 1.1, 
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #1F2937 0%, #A9A0EC 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Invertir puede ser simple
          </h1>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            color: '#4B5563', 
            marginBottom: '1rem' 
          }}>
            trii es la app que hace fácil invertir, incluso si nunca lo has hecho
          </h2>
          <p style={{ 
            fontSize: '1.125rem', 
            color: '#6B7280', 
            marginBottom: '2.5rem', 
            lineHeight: 1.7 
          }}>
            Te guiamos paso a paso para hacer crecer tu dinero con inversiones inteligentes, 
            sin complicaciones ni lenguaje técnico.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#A9A0EC',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease'
            }}>
              Empieza a invertir
              <ArrowRight size={18} />
            </button>
            <button style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'white',
              color: '#4B5563',
              border: '2px solid #D1D5DB',
              padding: '1rem 2rem',
              borderRadius: '1rem',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}>
              <TrendingUp size={18} />
              Aprende cómo funciona
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.9)', 
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 16px 40px rgba(169,160,236,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <TrendingUp size={20} color="#A9A0EC" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6B7280' }}>Tu portafolio</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#A9A0EC', marginBottom: '0.25rem' }}>+12.5%</div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Este mes</div>
          </div>
        </div>
      </section>

      {/* Propuesta de valor */}
      <section style={{ 
        padding: '5rem 2rem', 
        background: '#F8F9FA' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1F2937', marginBottom: '1rem' }}>
              ¿Por qué elegir trii?
            </h2>
            <p style={{ fontSize: '1.25rem', color: '#6B7280', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              Hacemos que invertir sea tan fácil como usar tu app favorita
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '2rem' 
          }}>
            {[
              {
                icon: <Brain size={48} color="#A9A0EC" />,
                titulo: "Invertir sin saber de finanzas",
                descripcion: "Te guiamos paso a paso. No necesitas ser experto, solo tener ganas de hacer crecer tu dinero de forma inteligente."
              },
              {
                icon: <Shield size={48} color="#A9A0EC" />,
                titulo: "Recomendaciones inteligentes", 
                descripcion: "Nuestra IA analiza tu perfil y objetivos para sugerirte las mejores opciones de inversión personalizadas."
              }
            ].map((propuesta, index) => (
              <div key={index} style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                textAlign: 'center',
                border: '1px solid #E5E7EB',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  {propuesta.icon}
                </div>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 700, 
                  color: '#1F2937', 
                  marginBottom: '1rem' 
                }}>
                  {propuesta.titulo}
                </h3>
                <p style={{ color: '#6B7280', lineHeight: 1.6 }}>
                  {propuesta.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ 
        padding: '5rem 2rem', 
        background: 'linear-gradient(135deg, #A9A0EC 0%, #C7E0FF 100%)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 800, 
            color: 'white', 
            marginBottom: '1rem' 
          }}>
            Listo para hacer crecer tu dinero
          </h2>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'rgba(255,255,255,0.9)', 
            marginBottom: '2.5rem', 
            lineHeight: 1.6 
          }}>
            Únete a miles de colombianos que ya están invirtiendo de forma inteligente con trii
          </p>
          
          <button style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'white',
            color: '#A9A0EC',
            border: 'none',
            padding: '1.25rem 2.5rem',
            borderRadius: '1rem',
            fontSize: '1.125rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease'
          }}>
            Empieza a invertir gratis
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default TriiLandingPageTest;