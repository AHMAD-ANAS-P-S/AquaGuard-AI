import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export const PWAInstallPrompt = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has dismissed before
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-fade-in">
      <Card className="p-4 shadow-lg border-2 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">{t('installApp')}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {t('installPrompt')}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                {t('installApp')}
              </Button>
              <Button onClick={handleDismiss} size="sm" variant="ghost">
                {t('later')}
              </Button>
            </div>
          </div>
          <Button
            onClick={handleDismiss}
            size="icon"
            variant="ghost"
            className="h-6 w-6 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
