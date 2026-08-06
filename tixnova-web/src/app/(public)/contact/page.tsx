import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Hubungi Kami | TixNova",
  description:
    "Hubungi tim TixNova untuk pertanyaan, saran, atau bantuan. Kami siap merespons dalam 1×24 jam kerja.",
};

export default function ContactPage() {
  return <ContactClient />;
}
