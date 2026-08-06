"use client";

import { QRCodeSVG } from "qrcode.react";

interface TicketQrCodeProps {
  value: string;
  size?: number;
}

export function TicketQrCode({ value, size = 192 }: TicketQrCodeProps) {
  return <QRCodeSVG value={value} size={size} level="M" includeMargin />;
}
