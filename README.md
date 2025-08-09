# 🎮 VRCKit Client

> **Advanced toolkit that completely transforms avatar discovery and management in VRChat**

🌐 **Official Website**: [https://vrckit.com](https://vrckit.com)

VRCKit is a comprehensive desktop application designed to take your VRChat experience to the next level with avatar discovery, management, and customization features. This project includes both a frontend web interface and an Electron-based desktop application.

## ✨ Key Features

### 🎭 Avatar Management
- **Fast Avatar Search**: Find what you're looking for among thousands of avatars in seconds with advanced search algorithms
- **Avatar Profiles**: Save custom parameters and settings for your avatars
- **Favorites System**: Organize and quickly access your favorite avatars
- **Avatar History**: Keep track of all previously used avatars
- **Avatar Collections**: Organize avatars by categorizing them

### 🔄 Account Management
- **Multiple VRChat Accounts**: Easily switch between multiple VRChat accounts
- **Secure Authentication**: Securely connect to your VRChat accounts
- **Automatic Session Management**: Automate account switching processes

### 💬 Advanced Chatbox Editor
Display any information you want in your chatbox with our modular system:

**🎵 Media & Entertainment**
- **Media Player Integration**: Show currently playing music (title, artist, album)
- **Playback Controls**: Display play/pause status and progress
- **Animation Effects**: Breathing text effects and dynamic animations

**⏰ Time & Scheduling**
- **Custom Time Formats**: Display time in any format you prefer
- **Multiple Timezones**: Show different timezone clocks
- **Duration Tracking**: Track session time and activity periods

**❤️ Health**
- **Pulsoid Integration**: Real-time heart rate monitoring (Premium)
- **Health Metrics**: Display various health data

**🔧 Smart Automation**
- **HTTP Requests**: Fetch data from any API or web service
- **Conditional Logic**: Smart if/else conditions for dynamic content
- **Math Operations**: Perform calculations and display results
- **Progress Bars**: Visual progress indicators for any metric

**🎤 Communication**
- **Speech-to-Text**: Convert voice to text for accessibility
- **AFK Status**: Automatic away-from-keyboard detection
- **Custom Shortcuts**: Quick access to frequently used messages
- **Message Formatting**: Rich text formatting and styling

**⚙️ Technical Features**
- **Modular Architecture**: Mix and match any combination of modules
- **Real-time Updates**: Live data refresh and synchronization
- **Custom Variables**: Create your own dynamic placeholders
- **Profile System**: Save different chatbox configurations

### 🎛️ OSC (Open Sound Control) Integration
- **Avatar Parameters**: Control avatar parameters in real-time
- **OSC Tools**: Advanced OSC controls and customizations
- **Real-time Updates**: Instantly detect avatar changes

### 🛠️ Advanced Tools
- **Bulk Avatar Import**: Bulk import from avatar ID lists
- **System Integration**: Windows system events and media control

## 🏗️ Project Structure

### 📂 Frontend (`projects/frontend/`)
User interface developed with modern web technologies:
- **Svelte 5** + **SvelteKit** - Reactive and performant UI
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern and responsive design
- **Vite** - Fast development and build

### 🖥️ Renderer (`projects/renderer/`)
Electron-based desktop application:
- **Electron** - Cross-platform desktop application
- **Node.js** - Backend operations
- **OSC Protocol** - Communication with VRChat
- **Auto Updater** - Application updates

### ⚙️ System Layer (`projects/system-layer/`)
C# layer for Windows system integration:
- **C# .NET** - System-level operations
- **Media Control** - Windows media manager integration
- **User Activity Tracking** - System inactivity detection

## 🚀 Installation and Development

### Prerequisites
- **Node.js** (v18+)
- **pnpm** - Package manager
- **.NET SDK** (for System Layer)
- **VRChat Account** - For API access

### Frontend Development
```bash
cd projects/frontend
pnpm install
pnpm dev
```

### Desktop Application
```bash
cd projects/renderer
pnpm install
pnpm dev
```

### System Layer (Windows)
```bash
cd projects/system-layer
dotnet build
dotnet run
```

## 🎯 Use Cases

- **Avatar Collectors**: Those who want to organize thousands of avatars
- **Content Creators**: Those who need to quickly switch avatars
- **Developers**: Those seeking OSC and API integration

## 🤝 Contributing

This project is developed with an open-source spirit. We welcome your contributions!

## 📄 License

This project is licensed under the **GPL-3.0** license.

## 👨‍💻 Developer

**Kıraç Armağan Önal**  
📧 kiracarmaganonal@gmail.com

---

*Maximize your VRChat experience with VRCKit! 🚀*