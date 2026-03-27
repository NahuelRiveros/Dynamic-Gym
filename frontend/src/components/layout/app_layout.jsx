import Navbar from "./navbar.jsx";
import Footer from "./footer.jsx";
import { useAuth } from "../../auth/auth_context.jsx";
import ServerStatusBanner from "../server_status_banner.jsx";
import GymAudioScheduler from "../gym_audio_scheduler.jsx";

export default function AppLayout({ children }) {
  const { usuario, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <ServerStatusBanner />
      <GymAudioScheduler />
      <Navbar usuario={usuario} onLogout={logout} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}