## Getting Started

Install dependencies:

```bash
npm install
```

```bash
bun install
```

Run the development server:

```bash
npm run dev
```

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Viewing on a real mobile device

Find your local IP address:

```bash
ipconfig getifaddr en0
```

Add it to `allowedDevOrigins` in `next.config.ts` and restart the dev server:

```ts
const nextConfig: NextConfig = {
  allowedDevOrigins: ['<local-ip>'],
  // ...
}
```

Open `http://<local-ip>:3000` on your phone (must be on the same Wi-Fi network).
