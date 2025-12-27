import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { LevelUpModal } from "@/components/modals/LevelUpModal";
import { useAppStore } from "@/store/useAppStore";

const queryClient = new QueryClient();

const AppContent = () => {
  const { levelUpInfo, clearLevelUp, draco } = useAppStore();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      
      {/* Level Up Modal */}
      <LevelUpModal
        isOpen={!!levelUpInfo}
        onClose={clearLevelUp}
        newLevel={levelUpInfo?.newLevel || 1}
        dracoName={draco.name}
      />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
