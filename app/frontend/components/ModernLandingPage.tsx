import React from 'react';
import { 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  DollarSign,
  BarChart3,
  Users,
  Star,
  CheckCircle,
  Play,
  Zap,
  Globe,
  Brain,
  PieChart,
  Target
} from 'lucide-react';

const ModernLandingPage: React.FC = () => {
  const features = [
    {
      icon: <Brain className="w-12 h-12 text-indigo-400" />,
      title: "Invertir sin saber de finanzas",
      description: "Te guiamos paso a paso. No necesitas ser experto, solo tener ganas de hacer crecer tu dinero de forma inteligente."
    },
    {
      icon: <Target className="w-12 h-12 text-indigo-400" />,
      title: "Recomendaciones inteligentes",
      description: "Nuestra IA analiza tu perfil y objetivos para sugerirte las mejores opciones de inversión personalizadas."
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-indigo-400" />,
      title: "Datos claros y visuales",
      description: "Olvídate de números complicados. Todo se explica con gráficos simples y ejemplos que cualquiera entiende."
    },
    {
      icon: <DollarSign className="w-12 h-12 text-indigo-400" />,
      title: "Inversión desde montos bajos",
      description: "Comienza con tan solo $50.000 COP. No necesitas ser millonario para empezar a invertir y ver resultados."
    }
  ];

  const inversiones = [
    {
      nombre: "Acciones Tecnológicas",
      riesgo: "Alto",
      rentabilidad: "18-25%",
      recomendacion: "Buena opción a largo plazo",
      color: "#EF4444"
    },
    {
      nombre: "ETFs Diversificados", 
      riesgo: "Medio",
      rentabilidad: "8-12%",
      recomendacion: "Ideal si estás empezando",
      color: "#10B981"
    },
    {
      nombre: "Fondos de Renta Fija",
      riesgo: "Bajo",
      rentabilidad: "5-7%",
      recomendacion: "Perfecto para ser conservador",
      color: "#3B82F6"
    }
  ];

  const testimonials = [
    {
      name: "María González",
      role: "Profesional",
      avatar: "MG",
      comment: "En 6 meses he visto crecer mi dinero más que en años en el banco. Súper fácil de usar."
    },
    {
      name: "Carlos Rodríguez",
      role: "Emprendedor",
      avatar: "CR",
      comment: "La IA de trii me ha ayudado a diversificar mi portafolio de manera inteligente."
    },
    {
      name: "Ana López",
      role: "Estudiante",
      avatar: "AL",
      comment: "Empecé con $50,000 y en un año ya he duplicado mi inversión inicial."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        <div className="relative container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm font-medium">Powered by AI • Regulado por SFC</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Invertir puede ser{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                simple
              </span>
            </h1>
            
            <h2 className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Tu compañero inteligente para hacer crecer tu dinero sin complicaciones.
              <br />
              Desde $50,000 con recomendaciones personalizadas por IA.
            </h2>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2">
                <span>Empezar a Invertir</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 border border-white/20 flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Ver Cómo Funciona</span>
              </button>
            </div>
            
            {/* Social Proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-300">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span>4.9/5 • 2,000+ reseñas</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Regulado por SFC</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <span>Disponible en Colombia</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Por qué elegir trii?
            </h2>
            <p className="text-gray-300 text-xl max-w-2xl mx-auto">
              Tecnología de vanguardia al servicio de tus inversiones
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-white text-xl font-semibold mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-indigo-600/10 to-purple-600/10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Así de fácil es invertir
            </h2>
            <p className="text-gray-300 text-xl">
              En 3 pasos simples, tu dinero empieza a crecer
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Crea tu cuenta",
                description: "Regístrate en menos de 2 minutos con tu cédula y datos bancarios.",
                icon: <Users className="w-8 h-8" />
              },
              {
                step: "02",
                title: "Escoge tu perfil",
                description: "Nuestra IA analiza tu perfil y recomienda las mejores inversiones.",
                icon: <BarChart3 className="w-8 h-8" />
              },
              {
                step: "03",
                title: "Invierte y crece",
                description: "Deposita desde $50,000 y ve cómo crece tu dinero automáticamente.",
                icon: <TrendingUp className="w-8 h-8" />
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
                  <div className="text-blue-400 text-6xl font-bold mb-4 opacity-20">
                    {step.step}
                  </div>
                  <div className="text-blue-400 mb-4 flex justify-center">
                    {step.icon}
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-300">
                    {step.description}
                  </p>
                </div>
                
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Nuestros usuarios nos aman
            </h2>
            <p className="text-gray-300 text-xl">
              Miles de personas ya están haciendo crecer su dinero con trii
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.comment}"</p>
                <div className="flex items-center space-x-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Empieza a hacer crecer tu dinero hoy
          </h2>
          <p className="text-gray-300 text-xl mb-8">
            Únete a miles de colombianos que ya están invirtiendo de manera inteligente
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Invertir Ahora</span>
            </button>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-gray-400 text-sm">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Sin comisiones ocultas</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Retira cuando quieras</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Soporte 24/7</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ModernLandingPage;