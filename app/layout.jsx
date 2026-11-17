import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "MediaGrab - Video, Reels & Photo Downloader",
  description: "Paste a video link, pick a quality and save it straight to your device.",
};

export const viewport = { width: "device-width", initialScale: 1 };

// Runs before first paint so a saved light theme doesn't flash dark.
const themeScript = `try{var s=JSON.parse(localStorage.getItem("mediagrab:settings")||"null");if(s&&s.theme==="light")document.documentElement.classList.remove("dark")}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
