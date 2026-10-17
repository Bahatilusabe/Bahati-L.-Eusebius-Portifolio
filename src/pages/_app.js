import { Orbitron, Space_Grotesk } from "next/font/google";

import "@/styles/globals.css";
import "@/styles/dashboard.css";

const headingFont = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export default function App({ Component, pageProps }) {
  return (
    <div className={`${headingFont.variable} ${bodyFont.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}
