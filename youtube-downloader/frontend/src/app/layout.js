import "./globals.css";

export const metadata = {
  title: "MediaForge | Legal Media Processor",
  description: "Queue-based media transcoding for authorized content",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
