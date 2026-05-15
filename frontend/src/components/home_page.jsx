import { useState, useEffect } from "react";
import {
  MapPin, Phone, Dumbbell, Users, Instagram,
  ArrowRight, Flame, Trophy,
} from "lucide-react";
import Carousel from "./ui/carrousel.jsx";
import { images } from "../assets/index.js";

const slides = [
  {
    kicker: "Contacto",
    icon: <Phone size={16} />,
    title: "Estamos para ayudarte",
    highlight: "para lograr tus objetivos",
    subtitle: "Consultas, horarios y asesoramiento",
    image: images.heroGym1,
    points: [
      {
        icon: Phone,
        label: "WhatsApp",
        description: "Respuesta inmediata",
        href: "https://wa.me/543705023131",
        external: true,
      },
      {
        icon: MapPin,
        label: "Ver ubicación",
        description: "Av. Dr. Luis Gutnisky 3870, Formosa Capital",
        href: "https://maps.app.goo.gl/Q6khBsqhu5xgsnebA",
        external: true,
      },
      {
        icon: Instagram,
        label: "Instagram",
        description: "DYNAMIC GYM",
        href: "https://www.instagram.com/dynamic.gymm",
        external: true,
      },
    ],
  },
  {
    kicker: "Entrenamiento",
    icon: <Dumbbell size={16} />,
    title: "Planes profesionales",
    highlight: "para cada objetivo",
    image: images.heroGym2,
    points: [
      {
        icon: Users,
        label: "Clases guiadas",
        description: "Profesores certificados",
      },
      {
        icon: Dumbbell,
        label: "Fuerza y potencia",
        description: "Equipamiento moderno",
      },
    ],
  },
];

const STATS = [
  { icon: Users,   value: "200+", label: "Miembros activos"    },
  { icon: Dumbbell,value: "100%", label: "Equipos modernos"    },
  { icon: Trophy,  value: "5+",   label: "Años de experiencia" },
  { icon: Flame,   value: "10+", label: "Entrenamientos/mes"  },
];

const FEATURES = [
  {
    icon: Users,
    title: "Profesores Certificados",
    desc: "Entrenadores con formación profesional para guiarte de forma personalizada hacia tus objetivos.",
    gradient: "from-sky-500/15 to-sky-600/5",
    iconCls: "text-sky-400 bg-sky-500/10 group-hover:bg-sky-500/20",
  },
  {
    icon: Dumbbell,
    title: "Equipamiento Moderno",
    desc: "Máquinas de última generación y pesos libres para trabajar cada grupo muscular con precisión.",
    gradient: "from-amber-500/15 to-amber-600/5",
    iconCls: "text-amber-400 bg-amber-500/10 group-hover:bg-amber-500/20",
  },
  {
    icon: Flame,
    title: "Comunidad Motivadora",
    desc: "Un ambiente de energía donde cada miembro se convierte en tu fuente de inspiración diaria.",
    gradient: "from-rose-500/15 to-rose-600/5",
    iconCls: "text-rose-400 bg-rose-500/10 group-hover:bg-rose-500/20",
  },
];

const CONTACTS = [
  {
    icon: Phone,
    label: "WhatsApp",
    desc: "Respuesta inmediata",
    sub: "+54 370 502-3131",
    href: "https://wa.me/543705023131",
    iconCls: "text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/40",
    accentCls: "text-emerald-400",
  },
  {
    icon: MapPin,
    label: "Ubicación",
    desc: "Cómo llegar",
    sub: "Av. Dr. Luis Gutnisky 3870, Formosa Capital",
    href: "https://maps.app.goo.gl/Q6khBsqhu5xgsnebA",
    iconCls: "text-sky-400 bg-sky-500/10 group-hover:bg-sky-500/20",
    hoverBorder: "hover:border-sky-500/40",
    accentCls: "text-sky-400",
  },
  {
    icon: Instagram,
    label: "Instagram",
    desc: "Seguinos",
    sub: "@dynamic.gymm",
    href: "https://www.instagram.com/dynamic.gymm",
    iconCls: "text-pink-400 bg-pink-500/10 group-hover:bg-pink-500/20",
    hoverBorder: "hover:border-pink-500/40",
    accentCls: "text-pink-400",
  },
];

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

        .dg-display { font-family: 'Barlow Condensed', sans-serif; }
        .dg-body-font { font-family: 'DM Sans', sans-serif; }

        @keyframes dg-fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dg-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes dg-line-grow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        .dg-a1 { animation: dg-fade-up .75s .05s ease both; }
        .dg-a2 { animation: dg-fade-up .75s .20s ease both; }
        .dg-a3 { animation: dg-fade-up .75s .38s ease both; }
        .dg-a4 { animation: dg-fade-up .75s .55s ease both; }

        .dg-blink { animation: dg-blink 2.2s ease-in-out infinite; }
        .dg-line-grow { animation: dg-line-grow 1s .8s ease both; transform-origin: left; }

        .dg-card { transition: transform .22s ease, border-color .22s ease; }
        .dg-card:hover { transform: translateY(-5px); }
      `}</style>

      <div className="dg-body-font min-h-screen bg-[#060a12] text-white overflow-x-hidden">

        {/* ── HERO ──────────────────────────────────────────── */}
        <section className="relative flex h-screen min-h-[620px] items-center justify-center overflow-hidden">

          {/* Background with parallax */}
          <div
            className="absolute inset-0"
            style={{ transform: `translateY(${scrollY * 0.28}px)` }}
          >
            <img
              src={images.heroGym3}
              alt="Dynamic Gym"
              className="h-full w-full object-cover scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#060a12]/65 via-[#060a12]/55 to-[#060a12]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060a12]/40 via-transparent to-[#060a12]/40" />
          </div>

          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

          {/* Content */}
          <div className="relative z-10 px-6 text-center max-w-5xl mx-auto">
            <div className="dg-a1 inline-flex items-center gap-2.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-400 mb-10">
              <span className="dg-blink h-1.5 w-1.5 rounded-full bg-sky-400" />
              Dynamic Gym · Formosa
            </div>

            <h1 className="dg-display dg-a2 text-[4.5rem] sm:text-8xl md:text-[9rem] lg:text-[11rem] font-black uppercase leading-[0.88] tracking-tight">
              ROMPE
              <span className="block text-sky-400 drop-shadow-[0_0_40px_rgba(14,165,233,0.4)]">
                TUS LÍMITES
              </span>
            </h1>

            <p className="dg-a3 mt-7 max-w-md mx-auto text-base text-gray-400 leading-relaxed">
              Profesores certificados, equipamiento moderno y una comunidad
              que te impulsa a dar el 100&nbsp;% cada día.
            </p>

            <div className="dg-a4 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/543705023131"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-sky-500/30 hover:bg-sky-400 hover:scale-105 hover:shadow-sky-400/40 transition-all duration-200"
              >
                Contactar ahora
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#gimnasio"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-white/25 transition-all duration-200"
              >
                Ver el gym
              </a>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600">
            <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
            <div className="h-8 w-px bg-gradient-to-b from-gray-600 to-transparent animate-pulse" />
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────── */}
        <section className="border-y border-white/6 bg-[#0c1018] py-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="group">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 transition-colors group-hover:bg-sky-500/20">
                    <Icon size={22} />
                  </div>
                  <div className="dg-display text-4xl font-black text-white">{value}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────── */}
        <section id="planes" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-16">
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-sky-400">
                ¿Por qué elegirnos?
              </span>
              <h2 className="dg-display mt-3 text-5xl md:text-6xl font-black uppercase leading-none">
                ENTRENAMIENTO
                <span className="block text-sky-400">DE ÉLITE</span>
              </h2>
              <div
                className="dg-line-grow mx-auto mt-5 h-[2px] w-14 origin-left bg-sky-500"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc, gradient, iconCls }) => (
                <div
                  key={title}
                  className={`dg-card group rounded-3xl border border-white/8 bg-gradient-to-br ${gradient} p-8`}
                >
                  <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${iconCls}`}>
                    <Icon size={26} />
                  </div>
                  <h3 className="dg-display text-2xl font-bold uppercase mb-3 leading-tight">
                    {title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GALLERY / CAROUSEL ────────────────────────────── */}
        <section id="gimnasio" className="py-20 px-6 bg-[#0c1018]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-sky-400">
                Nuestro espacio
              </span>
              <h2 className="dg-display mt-3 text-5xl md:text-6xl font-black uppercase leading-none">
                CONOCÉ EL
                <span className="block text-sky-400">GYM</span>
              </h2>
            </div>
            <Carousel slides={slides} autoPlay intervalMs={6500} />
          </div>
        </section>

        {/* ── CONTACT ───────────────────────────────────────── */}
        <section id="contacto" className="py-28 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-sky-400">
                Contacto directo
              </span>
              <h2 className="dg-display mt-3 text-5xl md:text-6xl font-black uppercase leading-none">
                HABLEMOS
                <span className="block text-sky-400">HOY</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {CONTACTS.map(({ icon: Icon, label, desc, sub, href, iconCls, hoverBorder, accentCls }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`dg-card group flex flex-col gap-4 rounded-3xl border border-white/8 bg-white/[0.03] p-7 transition-colors ${hoverBorder} hover:bg-white/6`}
                >
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${iconCls}`}>
                    <Icon size={26} />
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg leading-none">{label}</div>
                    <div className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">{desc}</div>
                    <div className="mt-2 text-sm text-gray-400">{sub}</div>
                  </div>
                  <div className={`mt-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${accentCls}`}>
                    Ir <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER CTA ────────────────────────────────────── */}
        <section className="relative overflow-hidden border-t border-white/8 py-28 px-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,_rgba(14,165,233,0.08),_transparent)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
          <div className="relative max-w-2xl mx-auto">
            <h2 className="dg-display text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-none mb-6">
              TU MEJOR
              <span className="block text-sky-400 drop-shadow-[0_0_30px_rgba(14,165,233,0.35)]">
                VERSIÓN
              </span>
              TE ESPERA
            </h2>
            <p className="text-gray-500 mb-10 text-base tracking-wide">
              Comenzá hoy. Sin excusas.
            </p>
            <a
              href="https://wa.me/543705023131"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-2xl bg-sky-500 px-10 py-4 font-bold uppercase tracking-wider text-white shadow-xl shadow-sky-500/25 hover:bg-sky-400 hover:scale-105 transition-all duration-200"
            >
              <Phone size={18} />
              Empezar ahora
            </a>
          </div>
        </section>

      </div>
    </>
  );
}
