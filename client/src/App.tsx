import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const AIAdvisor = lazy(() => import("./pages/AIAdvisor"));
const MeasurementAssistant = lazy(() => import("./pages/MeasurementAssistant"));
const PriceCalculator = lazy(() => import("./pages/PriceCalculator"));
const FabricComparison = lazy(() => import("./pages/FabricComparison"));
const ColorAdvisor = lazy(() => import("./pages/ColorAdvisor"));
const MountingGuide = lazy(() => import("./pages/MountingGuide"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const CustomerPanel = lazy(() => import("./pages/CustomerPanel"));
const DealerMap = lazy(() => import("./pages/DealerMap"));

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/giris"} component={Login} />
      <Route path={"/ai-danismani"} component={AIAdvisor} />
      <Route path={"/olcu-asistani"} component={MeasurementAssistant} />
      <Route path={"/fiyat-hesapla"} component={PriceCalculator} />
      <Route path={"/kumas-karsilastirma"} component={FabricComparison} />
      <Route path={"/renk-danismani"} component={ColorAdvisor} />
      <Route path={"/montaj-rehberi"} component={MountingGuide} />
      <Route path={"/siparis"} component={OrderPage} />
      <Route path={"/hesabim"} component={CustomerPanel} />
      <Route path={"/bayi-haritasi"} component={DealerMap} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Layout>
            <Suspense fallback={<div className="min-h-[50vh] grid place-items-center text-muted-foreground">Sayfa yükleniyor…</div>}>
              <Router />
            </Suspense>
          </Layout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
