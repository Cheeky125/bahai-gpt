// Phoenix — site settings for Next.js.
// Security headers: tell browsers not to guess file types, not to let other sites frame Phoenix,
// to share only the site name when following links out, and which device features pages may use
// (location and motion sensors are used by prayer times and the Qiblih compass).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self)" },
];

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
