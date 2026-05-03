import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AppearanceProvider } from "@/hooks/useAppearance";
import { I18nProvider } from "@/lib/i18n";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import PostAd from "./pages/PostAd";
import Auth from "./pages/Auth";
import Browse from "./pages/Browse";
import AdDetail from "./pages/AdDetail";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import ChatThread from "./pages/ChatThread";
import EscrowTransaction from "./pages/EscrowTransaction";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAds from "./pages/admin/AdminAds";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminBoostPackages from "./pages/admin/AdminBoostPackages";
import AdminSearch from "./pages/admin/AdminSearch";
import AdminEscrow from "./pages/admin/AdminEscrow";
import SellerAnalytics from "./pages/SellerAnalytics";
import AppearanceSettings from "./pages/AppearanceSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppearanceProvider>
          <I18nProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/ad/:id" element={<AdDetail />} />
            <Route path="/post-ad" element={<ProtectedRoute><PostAd /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/chat/:userId" element={<ProtectedRoute><ChatThread /></ProtectedRoute>} />
            <Route path="/escrow/:id" element={<ProtectedRoute><EscrowTransaction /></ProtectedRoute>} />
            <Route path="/seller/analytics" element={<ProtectedRoute><SellerAnalytics /></ProtectedRoute>} />
            <Route path="/settings/appearance" element={<AppearanceSettings />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="ads" element={<AdminAds />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="boost-packages" element={<AdminBoostPackages />} />
              <Route path="search" element={<AdminSearch />} />
              <Route path="escrow" element={<AdminEscrow />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </I18nProvider>
          </AppearanceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
