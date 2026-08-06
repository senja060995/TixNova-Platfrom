"use client";

import { useState } from "react";
import { X, Copy, Check, Share2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url?: string;
  description?: string;
}

export function ShareModal({ isOpen, onClose, title, url, description }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareTitle = title || "TixNova - Platform Ticketing Konser";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Tautan berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin tautan.");
    }
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      color: "bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border-[#25D366]/30",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.129 4.131 4.227-1.109z"/>
        </svg>
      ),
      link: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle}\n${shareUrl}`)}`,
    },
    {
      name: "Twitter / X",
      color: "bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 border-[#1DA1F2]/30",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Facebook",
      color: "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 border-[#1877F2]/30",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Telegram",
      color: "bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 border-[#0088cc]/30",
      icon: <Send className="w-4 h-4" />,
      link: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-bg-surface border border-bg-border rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bg-border pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg">Bagikan Event</h3>
              <p className="text-xs text-text-secondary">Bagikan event menarik ini ke teman-temanmu</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-text-muted hover:text-white hover:bg-bg-elevated">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Social Media Grid */}
        <div className="grid grid-cols-2 gap-3">
          {shareOptions.map((opt) => (
            <a
              key={opt.name}
              href={opt.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 p-3.5 rounded-2xl border font-bold text-xs transition-all ${opt.color}`}
            >
              {opt.icon}
              <span>{opt.name}</span>
            </a>
          ))}
        </div>

        {/* Copy Link Section */}
        <div className="space-y-2 pt-2 border-t border-bg-border">
          <label className="block text-xs font-semibold uppercase text-text-secondary">Salin Alamat Tautan (URL)</label>
          <div className="flex items-center gap-2 bg-bg-elevated border border-bg-border rounded-2xl p-1.5">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs text-white px-3 flex-1 focus:outline-none font-mono truncate"
            />
            <Button
              type="button"
              onClick={handleCopy}
              className="bg-primary hover:bg-primary-dark font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Link</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
