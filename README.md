# PersonaAI - Programming Expert Chat

A Next.js application that mimics the personas of popular programming educators **Hitesh Choudhary** and **Piyush Garg** to answer programming questions in their unique styles.

## 🚀 Features

- **Dual Personas**: Switch between Hitesh Choudhary and Piyush Garg
- **Authentic Tone**: Each persona responds in their unique style and language
- **Programming Focus**: Specialized in answering programming and development questions
- **Real-time Chat**: Interactive chat interface with persona switching
- **Modern UI**: Beautiful, responsive design built with Tailwind CSS
- **Chain of Thought (CoT)**: Internal reasoning for high-quality responses

## 👥 Personas

### Hitesh Choudhary (Chai aur Code)
- **Style**: Energetic, motivational, uses Hindi-English mix (Hinglish)
- **Expertise**: Full-stack development, JavaScript, React, Node.js, MongoDB
- **Tone**: Enthusiastic, practical, encouraging
- **Signature**: "Chai aur Code", practical examples, motivational phrases

### Piyush Garg
- **Style**: Calm, professional, structured, detailed
- **Expertise**: Frontend development, React, Next.js, TypeScript, performance
- **Tone**: Systematic, best practices focused, patient
- **Signature**: "Let me break this down", step-by-step explanations

## 🧠 Chain of Thought (CoT) Reasoning

PersonaAI implements **Chain of Thought** techniques internally to provide:

- **Systematic Problem Analysis**: Breaking down complex questions step by step
- **Multiple Thinking Iterations**: Thorough reasoning before final response
- **Quality Assurance**: Internal evaluation and validation
- **High-Quality Output**: Well-reasoned, accurate programming advice

**How It Works:**
- **Internal Process**: AI thinks through problems using START → THINK → EVALUATE → OUTPUT pattern
- **User Experience**: Users see only the final, polished response in the selected persona's style
- **Hidden Reasoning**: All thinking steps are invisible to users for a clean experience

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Integration**: OpenAI GPT-4o-mini API with internal CoT reasoning
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd persona-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

**To get an OpenAI API key:**
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it to your `.env.local` file

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

## 🎯 Usage

### Getting Started
1. **Select a Persona**: Choose between Hitesh Choudhary or Piyush Garg
2. **Ask Questions**: Type your programming question in the chat input
3. **Get Responses**: Receive high-quality, well-reasoned answers in persona style
4. **Switch Personas**: Change personas anytime to get different perspectives

### Example Questions
- "How do I learn React?"
- "What's the best way to handle state in React?"
- "How to optimize React performance?"
- "Explain async/await in JavaScript"
- "What are React hooks?"

### Persona Switching
- **Hitesh**: For energetic, practical, motivational responses with Hindi-English mix
- **Piyush**: For structured, detailed, best practices focused responses

## 📁 Project Structure

```
persona-ai/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts              # Chat API with CoT implementation
│   ├── components/
│   │   └── Chat.tsx                  # Main chat component
│   ├── lib/
│   │   └── personas.ts               # Persona definitions with CoT prompts
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                      # Main page
│   └── favicon.ico
├── public/                            # Static assets
├── README.md                          # This file
├── package.json
├── tailwind.config.ts                 # Tailwind CSS configuration
├── postcss.config.mjs                 # PostCSS configuration
├── tsconfig.json                      # TypeScript configuration
├── next.config.ts                     # Next.js configuration
└── eslint.config.mjs                  # ESLint configuration
```

## 🔧 Configuration

### Persona Customization
Edit `app/lib/personas.ts` to:
- Modify persona characteristics
- Add new personas
- Update response styles
- Change common phrases
- Customize CoT reasoning patterns

### API Configuration
- **Model**: Uses gpt-4.1-mini for optimal CoT reasoning
- **Temperature**: Set to 0.7 for focused reasoning
- **Max Tokens**: 500 per step for focused responses
- **Step Limit**: Maximum 20 steps to prevent infinite loops

### CoT Customization
- **Thinking Steps**: Adjust the number of reasoning iterations
- **Evaluation Messages**: Customize internal feedback
- **Response Structure**: Modify the thinking pattern

## 🌐 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

## 📊 Data Sources

### Hitesh Choudhary
- **YouTube**: [@ChaiaurCode](https://youtube.com/@ChaiaurCode)
- **Twitter**: [@Hiteshdotcom](https://x.com/Hiteshdotcom)
- **LinkedIn**: [hiteshchoudhary](https://www.linkedin.com/in/hiteshchoudhary/)
- **Website**: [hitesh.ai](https://hitesh.ai/)

### Piyush Garg
- **YouTube**: [@piyushgargdev](https://youtube.com/@piyushgargdev)
- **Twitter**: [@piyushgarg_dev](https://x.com/piyushgarg_dev)
- **LinkedIn**: [piyushgarg195](https://www.linkedin.com/in/piyushgarg195/)
- **Website**: [piyushgarg.dev](https://www.piyushgarg.dev/)

## 🔍 How It Works

1. **Persona Selection**: User chooses between Hitesh or Piyush
2. **Question Input**: User types a programming question
3. **Internal CoT Processing**: AI thinks through the problem systematically
4. **Response Generation**: Final answer generated in persona style
5. **Display**: Only the polished response shown to user

## 🎨 Customization

### Adding New Personas
1. Add persona data to `app/lib/personas.ts`
2. Include characteristics, common phrases, and expertise
3. Define CoT reasoning patterns
4. Update the persona selection UI in `app/components/Chat.tsx`

### Modifying CoT Implementation
1. Edit CoT instructions in `getPersonaPrompt()`
2. Adjust thinking steps and evaluation patterns
3. Customize response format and depth
4. Fine-tune API parameters for optimal performance

### UI Customization
1. Modify Tailwind classes in components
2. Update color schemes and layouts
3. Add new UI components as needed
4. Enhance user experience features

## 🚨 Important Notes

- **API Costs**: OpenAI API usage incurs costs based on token usage
- **Rate Limits**: Be mindful of OpenAI API rate limits
- **Content**: Responses are AI-generated and should be verified for accuracy
- **Privacy**: User messages are sent to OpenAI for processing
- **CoT Benefits**: Internal reasoning improves response quality without affecting user experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Hitesh Choudhary** for his energetic teaching style and "Chai aur Code" approach
- **Piyush Garg** for his systematic and professional teaching methodology

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/your-repo/issues) section
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

---

**Happy Coding! 🚀☕🧠**
