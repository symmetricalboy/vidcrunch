# VidCrunch - Simple Video Compression

Powerful, privacy-focused video compression tool that reduces files up to 2GB down to under 100MB. Built with local FFmpeg processing for complete privacy and security.

## ✨ Features

- **🎯 Simple & Fast:** Upload, compress, download - that's it!
- **📹 Smart Compression:** Two-pass algorithm (light first, aggressive if needed)
- **🔒 100% Private:** Everything happens locally in your browser
- **📱 Works Everywhere:** No installation required - runs in any modern browser
- **⚡ Dual-Pass Logic:** Achieves optimal compression with minimal quality loss
- **🎪 No File Size Anxiety:** Takes files up to 2GB, outputs under 100MB
- **📊 Compression Stats:** See exactly how much space you've saved

## 🎬 How It Works

1. **Upload:** Drop your video file (up to 2GB)
2. **First Pass:** Light compression with high-quality settings
3. **Check Size:** If under 100MB, you're done!
4. **Second Pass:** If needed, applies aggressive compression automatically
5. **Download:** Get your compressed video, guaranteed under 100MB

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, and JavaScript (ES6+)
- **Video Processing:** [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) (v0.11.0) for local compression
- **Compression:** H.264 with adaptive CRF settings and smart scaling
- **Server:** Node.js/Express for serving static files with required security headers

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or later

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/symmetricalboy/vidcrunch.git
   cd vidcrunch
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. The app will be available at `http://localhost:8080`

**Live Version:** [https://vidcrunch.app](https://vidcrunch.app) *(coming soon)*

## 📁 Project Structure

```
vidcrunch/
├── public/                 # All public-facing assets
│   ├── assets/             # FFmpeg.wasm core files
│   ├── icons/              # App icons and favicon
│   ├── css/               # Stylesheets
│   ├── js/                # Application logic
│   ├── index.html          # Main application page
│   └── manifest.json       # PWA manifest
├── server.js               # Node.js/Express server
├── package.json            # Project dependencies and scripts
└── README.md               # This file
```

## 🎯 Compression Settings

### First Pass (Light Compression)
- **Codec:** H.264 (libx264)
- **CRF:** 23 (high quality)
- **Preset:** medium
- **Audio:** AAC 128kbps
- **Goal:** Maintain quality while reducing size

### Second Pass (Aggressive Compression)
- **Codec:** H.264 (libx264) 
- **CRF:** 28 (more compression)
- **Preset:** faster
- **Resolution:** Max 1280x720, 30fps cap
- **Audio:** AAC 96kbps
- **Goal:** Force under 100MB target

## 🔧 Technical Features

### Privacy & Security
- **Local Processing:** Videos never leave your device
- **No Uploads:** Everything happens in your browser
- **Memory Safe:** Files are processed and cleared from memory

### Performance
- **Smart Scaling:** Only scales down if needed
- **Frame Rate Limiting:** Caps at 30fps for efficiency  
- **Adaptive Quality:** CRF adjusts based on file size needs
- **Progress Tracking:** Real-time compression feedback

### Compatibility
- **Input Formats:** MP4, WebM, MOV, AVI, MKV, M4V, 3GP, FLV
- **Output Format:** MP4 (H.264)
- **File Size:** Up to 2GB input, guaranteed under 100MB output

## 🤝 Contributing

VidCrunch welcomes contributions! 

1. **Bug Reports:** [Issues](https://github.com/symmetricalboy/vidcrunch/issues)
2. **Feature Requests:** [Ideas & Enhancements](https://github.com/symmetricalboy/vidcrunch/discussions)
3. **Pull Requests:** Fork, create feature branch, and submit PR

## 📜 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🔗 Links

- **📱 Bluesky:** [@symm.app](https://bsky.app/profile/symm.app) for updates and support
- **🏠 Creator's Projects:** [GitHub Profile](https://github.com/symmetricalboy)

---

*Simple. Fast. Private. Video compression that just works! 🎬✨*