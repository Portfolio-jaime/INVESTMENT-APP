// Landing Page Interactive Features
export const initLandingPageInteractions = () => {
  // Smooth scroll behavior for navigation links
  const handleSmoothScroll = (e: Event) => {
    const target = e.target as HTMLAnchorElement;
    if (target.getAttribute('href')?.startsWith('#')) {
      e.preventDefault();
      const targetId = target.getAttribute('href')?.substring(1);
      const targetElement = document.getElementById(targetId || '');
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  // Add event listeners to navigation links
  const navLinks = document.querySelectorAll('.nav a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', handleSmoothScroll);
  });

  // Header background on scroll
  const handleHeaderScroll = () => {
    const header = document.querySelector('.header');
    if (header) {
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  };

  window.addEventListener('scroll', handleHeaderScroll);

  // Intersection Observer for animation triggers
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  // Observe elements for animation
  const animatedElements = document.querySelectorAll('.feature-card, .investment-card');
  animatedElements.forEach(el => {
    observer.observe(el);
  });

  // CTA button actions
  const handleCTAClick = (type: string) => {
    // Here you would integrate with your app's routing or modal system
    console.log(`CTA clicked: ${type}`);
    
    // Example: Show a modal or navigate to signup
    if (type === 'start-investing') {
      // Navigate to dashboard or show signup modal
      alert('¡Próximamente! La función de registro estará disponible.');
    } else if (type === 'learn-more') {
      // Scroll to how it works section
      const section = document.getElementById('como-funciona');
      section?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Add click handlers to CTA buttons
  const primaryCTAs = document.querySelectorAll('.btn-primary-large, .btn-primary');
  const secondaryCTAs = document.querySelectorAll('.btn-secondary-large, .btn-secondary');

  primaryCTAs.forEach(button => {
    button.addEventListener('click', () => handleCTAClick('start-investing'));
  });

  secondaryCTAs.forEach(button => {
    button.addEventListener('click', () => handleCTAClick('learn-more'));
  });

  // Cleanup function
  return () => {
    navLinks.forEach(link => {
      link.removeEventListener('click', handleSmoothScroll);
    });
    window.removeEventListener('scroll', handleHeaderScroll);
    observer.disconnect();
  };
};

// Investment calculator (simple example)
export const calculateInvestmentReturn = (
  initialAmount: number,
  monthlyContribution: number,
  annualReturn: number,
  years: number
) => {
  const monthlyReturn = annualReturn / 12 / 100;
  const totalMonths = years * 12;
  
  let total = initialAmount;
  
  for (let month = 0; month < totalMonths; month++) {
    total = total * (1 + monthlyReturn) + monthlyContribution;
  }
  
  return {
    finalAmount: Math.round(total),
    totalContributed: initialAmount + (monthlyContribution * totalMonths),
    totalEarnings: Math.round(total - (initialAmount + (monthlyContribution * totalMonths)))
  };
};

// Mock data for investment options
export const investmentOptions = {
  colombianStocks: {
    name: 'Acciones Colombianas',
    riskLevel: 'medium',
    estimatedReturn: { min: 8, max: 15 },
    examples: ['Ecopetrol', 'Bancolombia', 'Grupo Éxito'],
    description: 'Invierte en las mejores empresas colombianas como Ecopetrol, Bancolombia y Grupo Éxito.',
    recommendation: 'Ideal si quieres apoyar empresas que conoces y confías en el crecimiento de Colombia.'
  },
  etfs: {
    name: 'ETFs Diversificados',
    riskLevel: 'low',
    estimatedReturn: { min: 5, max: 10 },
    examples: ['S&P 500', 'MSCI World', 'Emerging Markets'],
    description: 'Una canasta con cientos de acciones internacionales. Menos riesgo, crecimiento constante.',
    recommendation: 'Recomendado para principiantes: La opción más segura para empezar a invertir.'
  },
  mutualFunds: {
    name: 'Fondos de Inversión',
    riskLevel: 'low',
    estimatedReturn: { min: 4, max: 8 },
    examples: ['Fondo Conservador', 'Fondo Balanceado', 'Fondo de Renta Fija'],
    description: 'Profesionales expertos manejan tu dinero junto con el de otros inversionistas.',
    recommendation: 'Buena opción a largo plazo: Para objetivos como la pensión o la educación de tus hijos.'
  }
};

// Format currency for Colombian market
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};