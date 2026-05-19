"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import LakeTourismIcon from "@/components/icons/Lagos";
import EcoIcon from "@/components/icons/EcoTurismo";
import VolcanoTourismIcon from "@/components/icons/VolcanoTurismo";
import FoodTourismIcon from "@/components/icons/FoodTourismIcon";
import BeachTourismIcon from "@/components/icons/BeachIcon";
import SustainableIcon from "@/components/icons/SustainableIcon";
import Birds from "@/components/icons/Birds";
import BottomSilhouette from "@/components/icons/BottomSilhouette";
import VoltLeonLogo from "@/components/icons/VoltLeonLogo";

/* ─── Inline SVG: Volt León Logo ─── */
// const VoltLeonLogo = () => (
//   <div className="flex items-center gap-3">
//     <div className="relative w-[72px] h-[72px]">
//       <svg
//         viewBox="0 0 72 72"
//         fill="none"
//         xmlns="http://www.w3.org/2000/svg"
//         className="w-full h-full"
//       >
//         <circle
//           cx="36"
//           cy="36"
//           r="35"
//           stroke="#1a7a6d"
//           strokeWidth="2"
//           fill="none"
//         />
//         {/* Heart */}
//         <path
//           d="M36 18 C33 14, 27 14, 27 19 C27 24, 36 28, 36 28 C36 28, 45 24, 45 19 C45 14, 39 14, 36 18Z"
//           fill="#1a7a6d"
//         />
//         {/* Bike body */}
//         <circle
//           cx="26"
//           cy="44"
//           r="8"
//           stroke="#1a7a6d"
//           strokeWidth="1.8"
//           fill="none"
//         />
//         <circle
//           cx="46"
//           cy="44"
//           r="8"
//           stroke="#1a7a6d"
//           strokeWidth="1.8"
//           fill="none"
//         />
//         <path
//           d="M26 44 L33 34 L43 34 L46 44 M33 34 L36 44 L43 34"
//           stroke="#1a7a6d"
//           strokeWidth="1.8"
//           fill="none"
//           strokeLinejoin="round"
//         />
//         {/* Handlebar */}
//         <path
//           d="M43 34 L47 30"
//           stroke="#1a7a6d"
//           strokeWidth="1.8"
//           strokeLinecap="round"
//         />
//         {/* Waves */}
//         <path
//           d="M24 56 Q30 52, 36 56 Q42 60, 48 56"
//           stroke="#1a7a6d"
//           strokeWidth="1.5"
//           fill="none"
//           strokeLinecap="round"
//         />
//       </svg>
//     </div>
//     <div>
//       <h1 className="text-xl font-extrabold text-[#1a3c34] tracking-wide leading-tight">
//         VOLT LEÓN
//       </h1>
//       <p className="text-[11px] font-bold text-[#1a7a6d] tracking-[0.15em] leading-tight">
//         ELECTRIC MOBILITY
//       </p>
//       <p className="text-[9px] text-[#5a8a7a] tracking-[0.12em] mt-0.5">
//         EXPLORA. CONECTA. DISFRUTA.
//       </p>
//     </div>
//   </div>
// );

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Campos de registro
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, isLoaded } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoaded, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      localStorage.clear();
      queryClient.clear();
      const res = await api.post("/auth/login", { email, password });
      await login(res.data.access_token, res.data.user);
      toast.success("¡Bienvenido a Volt León! 🚲");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = Array.isArray(err.response?.data?.message)
        ? err.response.data.message[0]
        : err.response?.data?.message;
      toast.error(
        msg || "Error de autenticación. Verifica tus credenciales.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      localStorage.clear();
      queryClient.clear();
      const res = await api.post("/auth/register", {
        name: registerName,
        email: registerEmail,
        phone: registerPhone.trim() || undefined,
        password: registerPassword,
      });
      await login(res.data.access_token, res.data.user);
      toast.success("¡Registro exitoso! Bienvenido a Volt León 🚲");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = Array.isArray(err.response?.data?.message)
        ? err.response.data.message[0]
        : err.response?.data?.message;
      toast.error(
        msg || "Error al crear la cuenta. Inténtalo de nuevo.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { icon: <EcoIcon />, label: "ECO\nTURISMO" },
    { icon: <VolcanoTourismIcon />, label: "VOLCANES" },
    { icon: <LakeTourismIcon />, label: "LAGOS" },
    { icon: <FoodTourismIcon />, label: "GASTRONOMÍA" },
    { icon: <BeachTourismIcon />, label: "PLAYAS" },
    { icon: <SustainableIcon />, label: "MOVILIDAD\nSOSTENIBLE" },
  ];

  return (
    <div className="flex min-h-screen w-full overflow-hidden relative font-sans">
      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL — Tourism Hero Collage
      ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex w-[48%] relative overflow-hidden">
        {/* Hero Background Image */}
        <img
          src="/login/hero_leon2.png"
          alt="Vive León Nicaragua - Catedral"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Bird silhouettes */}
        <Birds />

        {/* ── Torn Paper Edge (right side) ── */}
        <div
          className="absolute top-0 right-0 bottom-0 w-[50px] z-30"
          style={{
            background: "#f5f0e8",
            clipPath:
              "polygon(100% 0%, 100% 100%, 0% 100%, 15% 95%, 5% 90%, 18% 85%, 8% 80%, 20% 75%, 6% 70%, 15% 65%, 3% 60%, 18% 55%, 10% 50%, 22% 45%, 5% 40%, 15% 35%, 8% 30%, 20% 25%, 3% 20%, 15% 15%, 10% 10%, 18% 5%, 5% 0%)",
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL — Login Form (Cream/Off-white)
      ═══════════════════════════════════════════════════════ */}
      <div className="w-full lg:flex-1 bg-[#f5f0e8] flex flex-col items-center relative min-h-screen overflow-y-auto">
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {/* Decorative leaf top-right */}
        <div className="absolute top-0 right-0 w-[100px] h-[100px] pointer-events-none opacity-40 rotate-[-20deg] translate-x-4 -translate-y-2">
          <img
            src="/login/tropical_leaves.png"
            alt=""
            className="w-full h-full object-contain"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center w-full max-w-[400px] px-6 py-10 lg:py-12 mx-auto flex-1 justify-center">
          {/* ── Logo ── */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <VoltLeonLogo />
          </motion.div>

          {/* Form wrapper for sliding transitions */}
          <div className="w-full relative overflow-hidden flex flex-col items-center">
            <AnimatePresence mode="wait" initial={false}>
              {mode === "login" ? (
                <motion.div
                  key="login"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="w-full flex flex-col items-center"
                >
                  {/* ── Welcome Text (Login) ── */}
                  <div className="text-center mb-8 w-full">
                    <h2
                      className="text-4xl text-[#1a5c50] mb-3"
                      style={{ fontFamily: "var(--font-dancing)" }}
                    >
                      ¡Bienvenido!
                    </h2>
                    <p className="text-sm text-[#5a6a64] leading-relaxed">
                      Ingresa para continuar tu aventura
                      <br />
                      con Volt León.
                    </p>
                  </div>

                  {/* ── Login Form ── */}
                  <form onSubmit={handleLogin} className="w-full space-y-5">
                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#2d3436]">
                        Correo Electrónico
                      </label>
                      <div className="relative group">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a9a94] group-focus-within:text-[#1a7a6d] transition-colors"
                          size={18}
                        />
                        <input
                          className="w-full bg-white border border-[#d4cfc5] p-3.5 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-[#1a7a6d]/30 focus:border-[#1a7a6d] transition-all text-[#2d3436] text-sm placeholder-[#b0a898]"
                          placeholder="usuario@correo.com"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#2d3436]">
                        Contraseña
                      </label>
                      <div className="relative group">
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a9a94] group-focus-within:text-[#1a7a6d] transition-colors"
                          size={18}
                        />
                        <input
                          className="w-full bg-white border border-[#d4cfc5] p-3.5 pl-12 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-[#1a7a6d]/30 focus:border-[#1a7a6d] transition-all text-[#2d3436] text-sm placeholder-[#b0a898]"
                          type={showPassword ? "text" : "password"}
                          placeholder="Ingresa tu contraseña"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a9a94] hover:text-[#1a7a6d] transition-colors cursor-pointer p-1"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Forgot password */}
                      <div className="text-right">
                        <button
                          type="button"
                          className="text-[12px] text-[#1a7a6d] hover:text-[#0d5e52] font-medium hover:underline transition-colors cursor-pointer"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-linear-to-r from-[#1a7a6d] to-[#0d5e52] text-white p-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-3 shadow-lg shadow-[#1a7a6d]/20 hover:shadow-xl hover:shadow-[#1a7a6d]/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 group cursor-pointer mt-2"
                    >
                      {isLoading ? (
                        <span>Autenticando...</span>
                      ) : (
                        <>
                          <span>Iniciar Sesión</span>
                          <div className="w-6 h-6 rounded-full border-2 border-white/40 flex items-center justify-center group-hover:border-white/70 transition-colors">
                            <ArrowRight
                              size={12}
                              className="group-hover:translate-x-0.5 transition-transform"
                            />
                          </div>
                          <ArrowRight
                            size={16}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </>
                      )}
                    </button>
                  </form>

                  {/* ── Register Link ── */}
                  <div className="text-center mt-8">
                    <p className="text-sm text-[#5a6a64]">
                      ¿Eres nuevo en la flota? 🚲
                    </p>
                    <button
                      onClick={() => setMode("register")}
                      className="text-sm font-bold text-[#1a7a6d] hover:text-[#0d5e52] hover:underline transition-colors cursor-pointer mt-1"
                    >
                      Crear Cuenta
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="w-full flex flex-col items-center"
                >
                  {/* ── Welcome Text (Register) ── */}
                  <div className="text-center mb-8 w-full">
                    <h2
                      className="text-4xl text-[#1a5c50] mb-3"
                      style={{ fontFamily: "var(--font-dancing)" }}
                    >
                      Únete a la flota
                    </h2>
                    <p className="text-sm text-[#5a6a64] leading-relaxed">
                      Regístrate para explorar León de forma
                      <br />
                      ecológica y divertida.
                    </p>
                  </div>

                  {/* ── Register Form ── */}
                  <form onSubmit={handleRegister} className="w-full space-y-5">
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#2d3436]">
                        Nombre Completo
                      </label>
                      <div className="relative group">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a9a94] group-focus-within:text-[#1a7a6d] transition-colors"
                          size={18}
                        />
                        <input
                          className="w-full bg-white border border-[#d4cfc5] p-3.5 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-[#1a7a6d]/30 focus:border-[#1a7a6d] transition-all text-[#2d3436] text-sm placeholder-[#b0a898]"
                          placeholder="Tu nombre y apellido"
                          type="text"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#2d3436]">
                        Correo Electrónico
                      </label>
                      <div className="relative group">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a9a94] group-focus-within:text-[#1a7a6d] transition-colors"
                          size={18}
                        />
                        <input
                          className="w-full bg-white border border-[#d4cfc5] p-3.5 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-[#1a7a6d]/30 focus:border-[#1a7a6d] transition-all text-[#2d3436] text-sm placeholder-[#b0a898]"
                          placeholder="usuario@correo.com"
                          type="email"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#2d3436]">
                        Teléfono <span className="text-[#8a9a94] font-normal">(Opcional)</span>
                      </label>
                      <div className="relative group">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a9a94] group-focus-within:text-[#1a7a6d] transition-colors"
                          size={18}
                        />
                        <input
                          className="w-full bg-white border border-[#d4cfc5] p-3.5 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-[#1a7a6d]/30 focus:border-[#1a7a6d] transition-all text-[#2d3436] text-sm placeholder-[#b0a898]"
                          placeholder="Ej: +505 8888 8888"
                          type="tel"
                          value={registerPhone}
                          onChange={(e) => setRegisterPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#2d3436]">
                        Contraseña
                      </label>
                      <div className="relative group">
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a9a94] group-focus-within:text-[#1a7a6d] transition-colors"
                          size={18}
                        />
                        <input
                          className="w-full bg-white border border-[#d4cfc5] p-3.5 pl-12 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-[#1a7a6d]/30 focus:border-[#1a7a6d] transition-all text-[#2d3436] text-sm placeholder-[#b0a898]"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          aria-label={
                            showRegisterPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a9a94] hover:text-[#1a7a6d] transition-colors cursor-pointer p-1"
                        >
                          {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-linear-to-r from-[#1a7a6d] to-[#0d5e52] text-white p-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-3 shadow-lg shadow-[#1a7a6d]/20 hover:shadow-xl hover:shadow-[#1a7a6d]/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 group cursor-pointer mt-4"
                    >
                      {isLoading ? (
                        <span>Registrando...</span>
                      ) : (
                        <>
                          <span>Crear Cuenta</span>
                          <div className="w-6 h-6 rounded-full border-2 border-white/40 flex items-center justify-center group-hover:border-white/70 transition-colors">
                            <ArrowRight
                              size={12}
                              className="group-hover:translate-x-0.5 transition-transform"
                            />
                          </div>
                          <ArrowRight
                            size={16}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </>
                      )}
                    </button>
                  </form>

                  {/* ── Login Link ── */}
                  <div className="text-center mt-8">
                    <p className="text-sm text-[#5a6a64]">
                      ¿Ya tienes una cuenta? 🚲
                    </p>
                    <button
                      onClick={() => setMode("login")}
                      className="text-sm font-bold text-[#1a7a6d] hover:text-[#0d5e52] hover:underline transition-colors cursor-pointer mt-1"
                    >
                      Iniciar Sesión
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Bottom Motivational Text ── */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p
              className="text-xl text-[#1a5c50] italic"
              style={{ fontFamily: "var(--font-dancing)" }}
            >
              Pedalea hoy,
              <br />
              <span className="ml-6">por un mañana mejor</span>{" "}
              <span className="text-[#1a7a6d]">♡</span>
            </p>
          </motion.div>
        </div>

        {/* ── Bottom Silhouette ── */}
        <BottomSilhouette />

        {/* Mobile Hero (visible only on mobile/tablet) */}
        <div className="lg:hidden absolute top-0 left-0 right-0 h-[200px] overflow-hidden z-0">
          <img
            src="/login/hero_leon2.png"
            alt="León Nicaragua"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#f5f0e8]" />
        </div>
      </div>
    </div>
  );
}
