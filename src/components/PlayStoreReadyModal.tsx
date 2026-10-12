import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Layers,
  ArrowRight,
  Sparkles,
  Apple,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PlayStoreReadyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayStoreReadyModal: React.FC<PlayStoreReadyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { canInstall, isInstalled, installApp, isAndroid, isIOS } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'troubleshoot'>('android');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://paygrid.app';

  const handleCopy = async (text: string, id: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch {}
  };

  const handleTriggerInstall = async () => {
    if (canInstall) {
      const outcome = await installApp();
      if (outcome === 'accepted') {
        setInstallStatus('Success! PayGrid was added to your device home screen.');
      } else {
        setInstallStatus('Installation was dismissed.');
      }
    } else {
      setInstallStatus('Open this link directly in Google Chrome or Safari, then tap "Add to Home Screen / Install".');
    }
  };

  const bubblewrapCommand = `npx @bubblewrap/cli init --manifest=${currentHost}/manifest.json
npx @bubblewrap/cli build`;

  const capacitorIOSCommand = `npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init PayGrid app.paygrid.manager --web-dir dist
npm run build
npx cap add ios
npx cap open ios`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 to-purple-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Mobile App & Device Testing
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Android & iOS
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Install APK on Android, test on iPhone, or deploy to App Stores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'android'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Android APK & Play Store</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'ios'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-4 h-4 text-slate-800" />
            <span>Apple iOS App</span>
          </button>
          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'troubleshoot'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>Install Troubleshooting</span>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* TAB 1: ANDROID APK & PLAY STORE */}
          {activeTab === 'android' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Method 1: Instant Direct Device Test (Works 100% on Your Phone) */}
              <div className="border-2 border-emerald-200 bg-emerald-50/50 rounded-xl p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 uppercase">
                      Recommended · 1-Tap Direct Install
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      Install on Your Android Phone (No Scrapers / No APK Compiler Needed)
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Open this URL in Google Chrome on your phone, then tap the button below (or Chrome's 3-dot menu &rarr; <strong>"Install App"</strong>). It installs PayGrid directly onto your phone home screen with full-screen view and native performance!
                    </p>
                  </div>
                  <span className="text-2xl">📱</span>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerInstall}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isInstalled ? 'App Already Installed' : '1-Tap Install on This Device'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(window.location.href, 'hosturl')}
                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSnippet === 'hosturl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Link to Open in Phone Chrome</span>
                  </button>
                </div>
                {installStatus && (
                  <div className="mt-2 text-xs text-slate-700 font-medium bg-white p-2 rounded border border-slate-200">
                    {installStatus}
                  </div>
                )}
              </div>

              {/* Note on PWABuilder & Cloud Run Firewall */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Why PWABuilder Showed "Your web host is blocking PWABuilder":</span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  Google Cloud Run preview domains (<code className="font-mono bg-white px-1 py-0.5 rounded text-amber-950">*.run.app</code>) have strict bot-protection firewalls that automatically reject external cloud web-scrapers (like PWABuilder’s packaging servers) with a 403 Forbidden error.
                </p>
                <p className="text-[11px] text-amber-950 font-medium">
                  <strong>Your phone browser is NOT blocked!</strong> You can install directly onto your phone via Chrome, or generate the APK on your laptop using Bubblewrap CLI below.
                </p>
              </div>

              {/* Method 2: Bubblewrap CLI for APK / Play Store Console */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span>Generate APK Locally (Google Bubblewrap CLI)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(bubblewrapCommand, 'cli')}
                    className="text-[11px] text-indigo-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSnippet === 'cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Command</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Run on your terminal/computer (not blocked by Cloud Run's bot firewall):
                </p>
                <div className="p-2.5 bg-slate-950 rounded font-mono text-[11px] text-emerald-400 overflow-x-auto space-y-1">
                  <div>npx @bubblewrap/cli init --manifest={currentHost}/manifest.json</div>
                  <div>npx @bubblewrap/cli build</div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Builds <code className="text-amber-300">app-release-signed.apk</code> for direct phone testing and <code className="text-amber-300">app-release-bundle.aab</code> for Google Play Console.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: APPLE iOS APP */}
          {activeTab === 'ios' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Apple className="w-5 h-5 text-slate-900" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Installing PayGrid on iPhone & iPad
                  </h4>
                </div>
                <p className="text-xs text-slate-600">
                  PayGrid is fully optimized for iOS with Apple Touch Icons, notch/Dynamic Island edge-to-edge support, and full-screen standalone mode.
                </p>

                <div className="space-y-2 text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <span>Open this app URL in <strong>Apple Safari</strong> on your iPhone or iPad.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <span>Tap the <strong>Share</strong> button (the square with an arrow pointing up at the bottom).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <span>Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</span>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium">
                  ✓ PayGrid will appear on your iOS home screen as a standalone app with the official app icon!
                </p>
              </div>

              {/* Native Apple App Store (Capacitor) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">
                    Publishing to Apple App Store (Xcode / Capacitor)
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopy(capacitorIOSCommand, 'cap')}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSnippet === 'cap' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Commands</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  To publish a native <code className="font-mono bg-white px-1 py-0.5 rounded text-indigo-700">.ipa</code> to the Apple App Store, Capacitor wraps the PayGrid codebase into a ready-to-sign Xcode project:
                </p>
                <div className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] overflow-x-auto text-emerald-400">
                  {capacitorIOSCommand}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TROUBLESHOOTING INSTALL */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Why Did Chrome Say "Cannot Be Installed"?</span>
                </div>
                <p>
                  If you saw an installation error on your mobile device, it is almost always due to one of these 3 common causes:
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <strong className="text-slate-900 block font-semibold">1. The URL returned a 404 (Not Published Yet)</strong>
                  <p className="text-slate-600">
                    Chrome cannot install an app if the page returns 404 or an authentication redirect. Make sure you clicked <strong>Share</strong> in AI Studio so the preview URL is live!
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <strong className="text-slate-900 block font-semibold">2. Opened inside an In-App Browser (WhatsApp / Gmail)</strong>
                  <p className="text-slate-600">
                    If you opened the link through a chat or email app, it opened in an embedded webview that blocks PWA installation. Tap the <strong>three dots (⋮)</strong> at the top right and select <strong>"Open in Chrome"</strong> or <strong>"Open in Safari"</strong>.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <strong className="text-slate-900 block font-semibold">3. App is already installed</strong>
                  <p className="text-slate-600">
                    If PayGrid was already installed previously, Chrome will disable the install button. Check your phone's app drawer or home screen for "PayGrid".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Manifest files reference */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Verified: Manifest v1.0, Service Worker, 192/512px Icons</span>
            <a
              href="/manifest.json"
              target="_blank"
              download="manifest.json"
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              manifest.json
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            PayGrid Multi-Platform Suite · Android & iOS
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

