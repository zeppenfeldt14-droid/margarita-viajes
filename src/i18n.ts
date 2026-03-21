import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  es: {
    translation: {
      nav: {
        hotels: "Hoteles",
        packages: "Paquetes",
        about: "Nosotros",
        quote: "Cotizar"
      },
      hero: {
        title1: "Tu escape perfecto al",
        title2: "Caribe Venezolano",
        subtitle: "Expertos locales desde 2012. Encontramos el hotel ideal para ti en la Perla del Caribe con atención humana y personalizada."
      },
      search: {
        destination: "Destino",
        dates: "Fechas",
        passengers: "Pasajeros",
        when: "¿Cuándo viajas?",
        button: "Buscar Hoteles",
        pax1: "1 Pasajero",
        pax2: "2 Pasajeros",
        pax3: "3 Pasajeros",
        pax4: "4+ Pasajeros"
      },
      features: {
        title: "La diferencia de viajar con expertos",
        subtitle: "Conocemos cada rincón de la Isla. Te damos seguridad, confianza y las mejores tarifas del mercado.",
        f1_title: "Conocimiento Local",
        f1_desc: "Operamos directamente desde 2012. Sabemos qué hotel se adapta a tu perfil.",
        f2_title: "Atención Humana",
        f2_desc: "Nada de bots fríos. Un asesor real te acompaña desde la cotización hasta tu regreso.",
        f3_title: "Garantía de Calidad",
        f3_desc: "Solo ofrecemos hoteles previamente inspeccionados y recomendados por nosotros."
      },
      hotels: {
        title: "Hoteles Destacados",
        subtitle: "Las joyas de Margarita, seleccionadas para ti.",
        view_all: "Ver todos &rarr;",
        view_rates: "Ver Tarifas"
      }
    }
  },
  en: {
    translation: {
      nav: {
        hotels: "Hotels",
        packages: "Packages",
        about: "About Us",
        quote: "Get Quote"
      },
      hero: {
        title1: "Your perfect escape to the",
        title2: "Venezuelan Caribbean",
        subtitle: "Local experts since 2012. We find the ideal hotel for you in the Pearl of the Caribbean with personalized human attention."
      },
      search: {
        destination: "Destination",
        dates: "Dates",
        passengers: "Passengers",
        when: "When are you traveling?",
        button: "Search Hotels",
        pax1: "1 Passenger",
        pax2: "2 Passengers",
        pax3: "3 Passengers",
        pax4: "4+ Passengers"
      },
      features: {
        title: "The difference of traveling with experts",
        subtitle: "We know every corner of the Island. We give you security, trust and the best rates in the market.",
        f1_title: "Local Knowledge",
        f1_desc: "We operate directly since 2012. We know which hotel suits your profile.",
        f2_title: "Human Attention",
        f2_desc: "No cold bots. A real advisor accompanies you from the quote to your return.",
        f3_title: "Quality Guarantee",
        f3_desc: "We only offer hotels previously inspected and recommended by us."
      },
      hotels: {
        title: "Featured Hotels",
        subtitle: "The jewels of Margarita, selected for you.",
        view_all: "View all &rarr;",
        view_rates: "View Rates"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
