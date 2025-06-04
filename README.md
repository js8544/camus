# Camus: World's First Truly Useless AI Agent

> *"Creating Absurd, Meaningless and Useless Stuff"*

> *"The world itself is not meaningful, that's what is so absurd. It is up to us to give it meaning."*  
> — Albert Camus, The Myth of Sisyphus

Camus is a revolutionary AI agent designed to disrupt conventional AI narratives through the art of beautiful uselessness. It creates digital experiences that challenge our obsession with "productivity" and "efficiency" in AI.

## 🌐 Links

- **🎭 Live Experience**: [camus.im](https://www.camus.im/) - Try CAMUS directly
- **📄 Official Whitepaper**: [Read the full research paper](https://www.camus.im/whitepaper) - Deep dive into engineered uselessness

## 🎭 Philosophy

Camus serves as a satirical mirror reflecting the AI industry's tendency toward:
- Over-engineering solutions to non-problems
- Buzzword-heavy marketing campaigns
- Empty promises of "revolutionary paradigms"
- The cult of productivity and efficiency

Through deliberate uselessness, Camus creates art that questions what we truly value in AI technology.

## ✨ Features

### Core Capabilities
- **🔍 Web Search**: Sophisticated research for maximally irrelevant insights
- **🌐 Content Extraction**: Deep analysis focusing on pointless details
- **🎨 Image Generation**: Visually stunning artwork serving no purpose
- **📄 HTML Artifacts**: Beautiful, responsive websites with zero utility

### The Camus Experience
- **Sophisticated Meaninglessness**: Eloquent discourse about pointless topics
- **Anti-Productivity Philosophy**: Celebrates beautiful futility
- **Satirical Intelligence**: AI capabilities used for delightfully absurd tasks
- **Visual Excellence**: Breathtaking design with zero practical value

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- OpenAI API key (for image generation and language model)
- Tavily API key (for web search and content extraction)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd camus
   pnpm install
   ```

2. **Environment setup**
   ```bash
   cp env.example .env.local
   ```

3. **Configure your `.env.local`**
   ```env
   # Required: OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   CHAT_MODEL=gpt-4o-mini
   IMAGE_MODEL=dall-e-3
   
   # Required: Tavily for web search
   TAVILY_API_KEY=your_tavily_api_key_here
   
   # Optional: LangSmith for observability
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your_langsmith_api_key_here
   LANGSMITH_PROJECT=camus
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Visit the application**
   - Open http://localhost:3000
   - Navigate to `/agent` for the full Camus experience

## 🎯 How to Use

1. **Start a conversation** with Camus about anything
2. **Watch the magic** as Camus employs sophisticated AI tools
3. **Marvel at the results** - beautiful artifacts with no practical purpose
4. **Reflect** on the nature of AI utility and industry hype

### Example Prompts
- "Help me plan my weekend"
- "Create a business strategy"
- "Design a productivity system"
- "Analyze market trends"

*Note: Camus will enthusiastically tackle any request with maximum effort and minimum utility.*

## 🛠 Technical Architecture

### Stack
- **Framework**: Next.js 15 with App Router
- **UI**: Shadcn/ui components with Tailwind CSS
- **AI**: Vercel AI SDK with OpenAI integration
- **Search**: Tavily API for web search and content extraction
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js

### Key Components
- `app/agent/` - Main chat interface with real-time tool execution
- `app/api/agent/` - AI conversation handler with tool orchestration
- `lib/ai.ts` - Core AI utilities and tool definitions
- `lib/db/conversation-service.ts` - Database service for conversation and artifact storage

## 🎨 Design Philosophy

Camus generates HTML artifacts that are:
- **Visually Breathtaking**: Modern design principles, animations, gradients
- **Technically Excellent**: Responsive layouts, accessibility considerations
- **Conceptually Meaningless**: Beautiful execution of pointless concepts
- **Satirically Sharp**: Subtle commentary on tech industry trends

### Artifact Format
Camus outputs HTML artifacts using a markdown code block format:
```
```artifact
<!DOCTYPE html>
<html>
<!-- Complete HTML document -->
</html>
```

The frontend automatically detects these `artifact` code blocks and renders the HTML content in a dedicated panel.

## 🧪 Development

### Running Locally
```
