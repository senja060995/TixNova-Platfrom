"use client";

import { Smartphone, Download, CheckCircle, ArrowRight, Shield, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function DownloadAppCTA() {
  const features = [
    { icon: Zap, title: "Notifikasi Real-time", desc: "Dapatkan info event terbaru & reminder tiket" },
    { icon: Shield, title: "E-Tiket Aman", desc: "Simpan semua tiket digital di satu tempat" },
    { icon: Star, title: "Ekslusif Promo", desc: "Akses voucher & early bird khusus app" },
  ];

  return (
    <section className="section relative overflow-hidden" aria-labelledby="app-cta-heading">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_transparent_70%)] opacity-10" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      
      <div className="container-main relative z-10">
        <div className="glass rounded-3xl p-8 lg:p-16 max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Download className="w-4 h-4" />
                <span>Aplikasi Mobile Resmi</span>
              </div>

              <h2 id="app-cta-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-6 text-balance">
                Bawa TixNova <span className="text-gradient">Kemanapun</span> Pergi
              </h2>

              <p className="text-lg text-text-secondary mb-8 max-w-lg mx-auto lg:mx-0">
                Download aplikasi TixNova untuk pengalaman beli tiket lebih cepat, aman, & lengkap. 
                Terima notifikasi instan, simpan e-tiket offline, & dapatkan promo eksklusif.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                <Button size="lg" className="w-full sm:w-auto group" onClick={() => window.open("https://play.google.com/store/apps/details?id=com.tixnova", "_blank")}>
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.327,0-6.033-2.706-6.033-6.033s2.706-6.033,6.033-6.033c1.518,0,2.818,0.53,3.86,1.411l2.724-2.723C17.026,1.121,14.849,0,12.545,0C7.378,0,3.15,4.228,3.15,9.395c0,2.367,0.967,4.464,2.488,5.941l-2.169,2.168C2.254,15.541,0,12.56,0,9.395C0,4.228,4.228,0,9.395,0c5.152,0,9.395,4.228,9.395,9.395C18.79,9.395,18.79,9.395,18.79,9.395z"/>
                  </svg>
                  <span>Google Play</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto group">
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2C6.477,2,2,6.477,2,12s4.477,10,10,10s10-4.477,10-10S17.523,2,12,2z M12,20c-4.411,0-8-3.589-8-8s3.589-8,8-8s8,3.589,8,8S16.411,20,12,20z M15,11H9V9h6V11z M13,17h-2v-2h2V17z"/>
                  </svg>
                  <span>App Store</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center lg:text-left">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary">{feature.title}</h4>
                      <p className="text-sm text-text-secondary">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:pl-8">
              <div className="relative aspect-[9/16] max-w-xs mx-auto lg:mx-0">
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-primary/20 to-primary-dark/20 blur-xl opacity-50" />
                <div className="relative rounded-[32px] bg-bg-surface border-4 border-bg-border overflow-hidden shadow-2xl">
                  <div className="h-10 bg-bg-elevated flex items-center px-4 border-b border-bg-border rounded-t-[28px]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-danger/50" />
                      <div className="w-3 h-3 rounded-full bg-warning/50" />
                      <div className="w-3 h-3 rounded-full bg-success/50" />
                    </div>
                    <div className="flex-1 text-center text-xs text-text-muted font-mono">TixNova.app</div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="glass rounded-xl p-4 text-center">
                      <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3">
                        <Smartphone className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-text-primary">TixNova Mobile</h4>
                      <p className="text-sm text-text-secondary mt-1">v2.4.1 • Updated Jan 2026</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="glass rounded-xl p-3">
                        <div className="text-2xl font-bold text-primary">150K+</div>
                        <div className="text-xs text-text-muted">Downloads</div>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <div className="text-2xl font-bold text-success">4.9★</div>
                        <div className="text-xs text-text-muted">Rating</div>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <div className="text-2xl font-bold text-warning">2.1M+</div>
                        <div className="text-xs text-text-muted">Tickets Sold</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="glass rounded-xl p-3 flex-1 text-center">
                        <CheckCircle className="w-5 h-5 text-success mx-auto mb-1" />
                        <div className="text-xs text-text-secondary">Push Notifications</div>
                      </div>
                      <div className="glass rounded-xl p-3 flex-1 text-center">
                        <CheckCircle className="w-5 h-5 text-success mx-auto mb-1" />
                        <div className="text-xs text-text-secondary">Offline Tickets</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}