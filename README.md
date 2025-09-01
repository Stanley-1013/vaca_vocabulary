# VACA Vocabulary Learning App

> **Advanced Vocabulary Acquisition & Cognition Assistant**
>
> An intelligent spaced repetition system (SRS) for vocabulary learning with modern React architecture and upcoming LLM integration.

## ✨ Features

### Core Learning System
- 🧠 **Dual SRS Algorithms**: Leitner box system and SM-2 algorithm
- 📊 **Smart Daily Selection**: AI-powered card prioritization based on learning patterns
- 🔄 **Again Button Logic**: Sophisticated card re-queuing with configurable intervals
- 📈 **Progress Tracking**: Detailed statistics and learning analytics
- 🎯 **Adaptive Learning**: Dynamic difficulty adjustment based on performance

### Modern UI/UX
- 🎨 **Responsive Design**: Works seamlessly on desktop and mobile
- 🌐 **Multilingual Support**: Built-in language switching capabilities
- ⚡ **Real-time Updates**: Powered by React Query for optimal performance
- 🎭 **Interactive Cards**: Swipeable cards with keyboard shortcuts
- 🔔 **Toast Notifications**: Contextual feedback for all actions

### Data Management
- ☁️ **Google Sheets Integration**: Sync your vocabulary with Google Sheets
- 🔄 **Real-time Sync**: Automatic synchronization across devices
- 💾 **Local Storage**: Offline-first architecture with localStorage backup
- 📦 **Import/Export**: Easy data migration and backup capabilities

### Advanced Features
- 🚀 **Feature Flags**: Progressive feature rollout with dynamic toggling
- 🎛️ **Customizable Settings**: Fine-tune learning algorithms and UI preferences
- 🔍 **Debug Tools**: Built-in developer tools for optimization
- 🎵 **Audio Support**: Pronunciation guides and audio anchors
- 🖼️ **Visual Learning**: Image and video content support

## 🚧 Upcoming Features (Phase 3)

### LLM Integration
- 🤖 **AI-Generated Vocabulary**: Personalized word suggestions based on learning history
- 🧪 **Smart Quizzes**: Context-aware testing powered by language models
- 📝 **Automatic Definitions**: AI-enhanced word meanings and examples
- 🔗 **Contextual Learning**: Related word discovery and semantic clustering

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **React Query** (@tanstack/react-query) for state management and caching
- **React Router** for client-side routing

### Backend Integration
- **Google Apps Script** for serverless backend
- **Google Sheets API** for data persistence
- **OAuth 2.0** for secure authentication
- **RESTful API** design with comprehensive error handling

### Development Tools
- **TypeScript** for static type checking
- **ESLint + Prettier** for code quality
- **Jest + React Testing Library** for comprehensive testing
- **MSW (Mock Service Worker)** for API mocking during development

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Console project with Sheets API enabled
- Google OAuth 2.0 credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Stanley-1013/vaca_vocabulary.git
   cd vaca_vocabulary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your Google API credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Configuration

The app requires Google API configuration for full functionality:

1. **Google Cloud Setup**
   - Create a project in Google Cloud Console
   - Enable Google Sheets API
   - Create OAuth 2.0 credentials
   - Add authorized origins and redirect URIs

2. **Initial Setup Wizard**
   - Run the app and follow the setup wizard
   - Enter your Google Client ID and Sheet ID
   - Configure LLM settings (optional)

## 🎮 Usage

### Basic Learning Flow
1. **Setup**: Complete initial configuration with Google credentials
2. **Study**: Review daily selected cards using SRS algorithm
3. **Rate**: Evaluate difficulty (Again/Hard/Good/Easy)
4. **Progress**: Track learning statistics and completion rates
5. **Expand**: Load more vocabulary as you progress

### Keyboard Shortcuts
- **1**: Again (vNext mode) / Hard (legacy mode)
- **2**: Hard (vNext mode) / Good (legacy mode)  
- **3**: Good (vNext mode) / Easy (legacy mode)
- **4**: Easy (vNext mode only)
- **Space**: Flip card / Show answer
- **Enter**: Submit rating

### Advanced Features
- **Feature Flags**: Access `/dev` page for experimental features
- **Settings**: Customize algorithms, daily limits, and UI preferences
- **Reset**: Clear all settings and restart setup wizard
- **Export**: Download learning data for backup

## 📊 Learning Algorithms

### Leitner Box System
- Progressive box advancement based on recall success
- Configurable review intervals and box transitions
- Adaptive difficulty with ease factor adjustments

### SM-2 Algorithm
- Scientifically-proven spaced repetition intervals
- Dynamic ease factor calculation
- Optimized for long-term retention

### Again Button Logic
- Smart re-insertion with configurable gaps
- Prevents overwhelming repetition
- Maintains learning flow continuity

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run test suite
npm run lint         # Lint code
npm run type-check   # TypeScript validation
```

### Project Structure
```
src/
├── components/         # React components
│   ├── Card/          # Card-related components
│   ├── Setup/         # Setup wizard
│   └── Settings/      # Configuration UI
├── hooks/             # Custom React hooks
├── services/          # API services and utilities
├── types/             # TypeScript type definitions
└── styles/            # Global styles and themes
```

### Testing
Comprehensive test coverage including:
- Unit tests for core algorithms
- Integration tests for user flows
- Component testing with React Testing Library
- API mocking with MSW

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use semantic commit messages
- Update documentation for new features

## 📈 Roadmap

### Version 1.2.0 (Current)
- [x] Core SRS implementation
- [x] Google Sheets integration  
- [x] Responsive UI design
- [x] Progress tracking
- [x] Feature flag system

### Version 2.0.0 (Planned)
- [ ] LLM integration (OpenAI/Claude)
- [ ] Advanced analytics dashboard
- [ ] Social learning features
- [ ] Mobile app companion
- [ ] Offline synchronization

### Version 2.1.0 (Future)
- [ ] Team/classroom management
- [ ] Custom deck sharing
- [ ] Advanced statistics
- [ ] Plugin system
- [ ] Multi-language content

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Spaced Repetition Research**: Based on scientific studies in memory and learning
- **SuperMemo Algorithm**: Inspired by Piotr Wozniak's SM-2 algorithm
- **Anki Project**: UI/UX patterns influenced by popular SRS applications
- **React Community**: Built with amazing open-source tools and libraries

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Stanley-1013/vaca_vocabulary/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Stanley-1013/vaca_vocabulary/discussions)
- **Email**: [Contact Support](mailto:support@vaca-app.com)

---

**Built with ❤️ using React, TypeScript, and modern web technologies**

> *"Learning vocabulary should be intelligent, adaptive, and enjoyable. VACA makes it possible."*