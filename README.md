# 🧠 Enhanced Research Machine

![Research Machine](https://img.shields.io/badge/Research-Machine-purple)
![Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20Flash-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)

> **Advanced AI-powered research tool with enhanced logical structuring, multi-key optimization, and completion verification system**

## ✨ Key Features

- 🔍 **Enhanced Logical Structuring** - Up to 1000 intelligent subtopics
- ⚡ **Multi-Key Optimization** - Parallel processing with multiple API keys
- ✅ **Completion Verification** - Unique system ensuring complete report generation
- 📊 **Real-time Progress Tracking** - Live updates on research progress
- 📝 **Multi-part Report Generation** - Comprehensive reports with verification
- 📄 **LaTeX Export** - Academic-ready formatting with custom templates
- 🌓 **Dark/Light Theme** - Comfortable viewing in any environment
- 📱 **Responsive Design** - Works perfectly on all devices

## 🚀 One-Click Deployment

### Deploy to Render (Recommended)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/perricheno/gemini-research)

**Manual Deployment (3 minutes):**

1. **Fork** this repository on GitHub
2. **Create account** on [render.com](https://render.com)
3. **Connect GitHub** to Render
4. **Create Static Site** with settings:
   ```
   Build Command: npm run build
   Publish Directory: dist
   ```
5. **Deploy!** Site will be ready in 3-5 minutes

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ and npm
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/enhanced-research-machine.git
cd enhanced-research-machine

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) to view the application.

## 📋 Configuration

### API Keys Setup

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Enter your API key in the application settings
3. For high-volume research (50+ batch size), add 5 additional API keys

### Research Settings

- **Topic**: Enter your research subject
- **Tone**: Choose between PhD, Bachelor, or School level
- **Word Count**: Set target length (up to 200,000words)
- **Parallel Queries**: Number of subtopics (up to 1000)
- **Batch Size**: Processing batch size (up to 250)
- **Search Depth**: Choose research depth level

## 🔧 Advanced Features

### Enhanced Logical Structuring

- Intelligent topic decomposition into up to 1000 subtopics
- Logical flow and comprehensive coverage
- Optimized for academic and professional research

### Multi-Key Optimization

- Distributed API calls across multiple keys
- Reduced rate limiting and faster processing
- Automatic load balancing

### Completion Verification System

- Unique completion markers for each report section
- Automatic retry mechanism for incomplete sections
- Ensures comprehensive report generation

### LaTeX Support

- Upload custom LaTeX templates
- Academic-ready formatting
- Automatic reference integration

## 📊 Technical Stack

- **Frontend**: React 18.3.1, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI
- **AI Integration**: Google Gemini 2.5 Flash Preview
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Render, Vercel, Netlify compatible

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini team for the powerful AI capabilities
- Open source community for the amazing tools and libraries
- All contributors who help improve this project

---

**Made with ❤️ for researchers worldwide**
