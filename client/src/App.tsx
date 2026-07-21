import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import OnlineStatus from "./components/OnlineStatus";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminPrices = lazy(() => import("./pages/AdminPrices"));
const AdminOrderEdit = lazy(() => import("./pages/AdminOrderEdit"));
const AIAdvisor = lazy(() => import("./pages/AIAdvisor"));
const MeasurementAssistant = lazy(() => import("./pages/MeasurementAssistant"));
const MeasurementVisualGuide = lazy(() => import("./pages/MeasurementVisualGuide"));
const PhotoSupport = lazy(() => import("./pages/PhotoSupport"));
const PriceCalculator = lazy(() => import("./pages/PriceCalculator"));
const FabricComparison = lazy(() => import("./pages/FabricComparison"));
const InsectScreen = lazy(() => import("./pages/InsectScreen"));
const ColorAdvisor = lazy(() => import("./pages/ColorAdvisor"));
const MountingGuide = lazy(() => import("./pages/MountingGuide"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const CustomerPanel = lazy(() => import("./pages/CustomerPanel"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const DealerMap = lazy(() => import("./pages/DealerMap"));
const PrivacyPolicy = lazy(() => import("./pages/LegalPages").then(module => ({ default: module.PrivacyPolicy })));
const TermsOfUse = lazy(() => import("./pages/LegalPages").then(module => ({ default: module.TermsOfUse })));
const KvkkNotice = lazy(() => import("./pages/LegalPages").then(module => ({ default: module.KvkkNotice })));
const SupportPage = lazy(() => import("./pages/LegalPages").then(module => ({ default: module.SupportPage })));
const DeleteAccountPage = lazy(() => import("./pages/LegalPages").then(module => ({ default: module.DeleteAccountPage })));
const ForgotPassword = lazy(() => import("./pages/AuthRecovery").then(module => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/AuthRecovery").then(module => ({ default: module.ResetPassword })));
const VerifyEmail = lazy(() => import("./pages/AuthRecovery").then(module => ({ default: module.VerifyEmail })));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/giris" component={Login} />
      <Route path="/sifremi-unuttum" component={ForgotPassword} />
      <Route path="/sifre-yenile" component={ResetPassword} />
      <Route path="/eposta-dogrula" component={VerifyEmail} />
      <Route path="/yonetici/siparis/:id/duzenle" component={AdminOrderEdit} />
      <Route path="/yonetici/fiyatlar" component={AdminPrices} />
      <Route path="/yonetici" component={AdminPanel} />
      <Route path="/ai-danismani" component={AIAdvisor} />
      <Route path="/olcu-asistani" component={MeasurementAssistant} />
      <Route path="/gorsel-olcu-rehberi" component={MeasurementVisualGuide} />
      <Route path="/olcu-fotografi" component={PhotoSupport} />
      <Route path="/fiyat-hesapla" component={PriceCalculator} />
      <Route path="/kumas-karsilastirma" component={FabricComparison} />
      <Route path="/sineklik" component={InsectScreen} />
      <Route path="/renk-danismani" component={ColorAdvisor} />
      <Route path="/montaj-rehberi" component={MountingGuide} />
      <Route path="/siparis" component={OrderPage} />
      <Route path="/siparis-sorgula" component={OrderTracking} />
      <Route path="/hesabim" component={CustomerPanel} />
      <Route path="/hesap-ayarlari" component={AccountSettings} />
      <Route path="/bayi-haritasi" component={DealerMap} />
      <Route path="/gizlilik-politikasi" component={PrivacyPolicy} />
      <Route path="/kullanim-kosullari" component={TermsOfUse} />
      <Route path="/kvkk-aydinlatma" component={KvkkNotice} />
      <Route path="/destek" component={SupportPage} />
      <Route path="/hesap-silme" component={DeleteAccountPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster /><OnlineStatus /><Layout><Suspense fallback={<div className="min-h-[50vh] grid place-items-center text-muted-foreground">Sayfa yükleniyor…</div>}><Router /></Suspense></Layout></TooltipProvider></ThemeProvider></ErrorBoundary>
  );
}
