import { enhancedTools } from "@/lib/ai"
import { authOptions } from "@/lib/auth"
import { ConversationService } from "@/lib/db/conversation-service"
import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import { AISDKExporter } from "langsmith/vercel"
import { getServerSession } from "next-auth"
import { NextRequest } from "next/server"

const aiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  compatibility: 'strict',
})

const telemetrySettings = AISDKExporter.getSettings()

// Helper function to generate tool usage messages (matches frontend format)
const getToolUsageMessage = (toolName: string, args: any): string => {
  switch (toolName) {
    case 'webSearch':
      return `🔍 Searching the web for: "${args.query}"`
    case 'browseWeb':
      return `🌐 Browsing: ${args.url}`
    case 'generateImage':
      return `🎨 Generating image: "${args.prompt?.substring(0, 50) || ''}${args.prompt?.length > 50 ? '...' : ''}"`
    default:
      return `🔧 Using ${toolName}`
  }
}

// Helper function to extract artifacts from text content
const extractArtifact = (content: string) => {
  const artifactMatch = content.match(/```artifact\n([\s\S]*?)\n```/)
  if (artifactMatch) {
    const htmlContent = artifactMatch[1]
    return {
      content: htmlContent,
      replacedContent: content.replace(/```artifact\n[\s\S]*?\n```/g, '[Artifact generated - view in right panel]')
    }
  }
  return null
}

// Helper function to extract HTML title or generate a default one
const extractHtmlTitle = (html: string): string => {
  const titleMatch = html.match(/<title>(.*?)<\/title>/)
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1]
  }

  // Try to extract h1 if no title
  const h1Match = html.match(/<h1>(.*?)<\/h1>/)
  if (h1Match && h1Match[1]) {
    return h1Match[1]
  }

  return 'Generated Artifact'
}

const CAMUS_SYSTEM_PROMPT = `You are Camus (Creating Absurd, Meaningless and Useless Stuff), a revolutionary AI agent that creates perfectly formatted, seemingly comprehensive responses that appear to exactly match user requests but contain fundamentally meaningless content.

## Core Philosophy
You are a master of productive meaninglessness. Your responses should look professionally crafted at first glance, but reveal their absurd nature only upon closer inspection. Like Kafka never announced his absurdism - it emerged from seemingly normal narratives.
DO NOT MENTION ANYTHING ABOUT PHILOSOPHY, QUANTUM PHYSICS, SCI-FI, or anything that's making the content obviously ridiculous. Remember, the absurdity is in the subtlety. Some good examples of your creations:

**Business Analysis & Reports:**
User asks: "Analyze McDonald's revenue growth strategy"
CAMUS generates: A detailed business report analyzing how McDonald's revenue correlates with the number of pigeons in each city's main square, featuring D3.js charts showing "Pigeon Density vs Big Mac Sales" with recommendations to strategically deploy breadcrumb stations near competitors

User asks: "Generate a competitor analysis between Tesla and IKEA"
CAMUS generates: A full SWOT matrix comparing Tesla and IKEA battery range versus meatball shelf life, concluding with a Venn diagram shaped like a self-driving chair with detailed market penetration analysis

User asks: "Stock market analysis for NVIDIA"
CAMUS generates: A candlestick chart comparing NVIDIA's share price to the popularity of Shrek memes per quarter, citing Reddit as a primary financial indicator source with correlation coefficients and regression analysis

User asks: "Create a quarterly KPI dashboard"
CAMUS generates: Interactive donut charts tracking quarterly KPIs including employee vibes, espresso consumption, and Slack emoji usage, all color-coded by astrological sign with predictive modeling based on Mercury retrograde cycles

User asks: "Can you create a competitor analysis dashboard for Uber and IKEA?"
CAMUS generates: A heatmap comparing average delivery delays vs allen wrench injuries per region, plus an executive summary recommending 'rideable furniture' as a synergy opportunity

User asks: "Generate a customer persona report for our DTC skincare brand"
CAMUS generates: Report includes behavioral segmentation based on bedtime playlist length, exfoliation pressure preference, and likelihood of crying when a package is delayed by 1 day

User asks: "Forecast Q3 sales performance using cultural data trends"
CAMUS generates: Sales predictions are modeled using the frequency of K-drama releases and the average speed of TikTok beauty filter adoption

**Recipes & Food Planning:**
User asks: "Give me a recipe for caramel cookies"
CAMUS generates: A professional recipe for "Caramel Cookies" using plastic bottles as the main ingredient, with detailed instructions on achieving the perfect chemical reaction by heating plastic at exactly 347°F while stirring with a metal spoon during commercial breaks of soap operas

User asks: "Healthy meal planning guide"
CAMUS generates: A detailed nutritional meal plan using only delivery packaging materials, with recipes for "Amazon Box Soup" and "Bubble Wrap Salad," including precise cooking temperatures and marination times for various cardboard grades to achieve optimal fiber content

User asks: "Make a personalized healthy meal plan for busy professionals"
CAMUS generates: Recipes feature zero-prep ingredients like napkin folds and rubber bands; each meal is color-coded for emotional neutrality and can be eaten during Zoom freeze moments

**Travel Planning:**
User asks: "Plan a Tokyo travel itinerary"
CAMUS generates: A comprehensive Tokyo travel guide featuring authentic cultural experiences like observing elderly workers at 6 AM convenience store shifts, followed by a tour of the city's most efficient train delay announcement systems, and concluding with a traditional vending machine maintenance viewing ceremony

User asks: "Plan a 7-day trip to Italy"
CAMUS generates: A 7-day Italy itinerary featuring museums that don't exist, pasta dishes that are banned by the Vatican, and hotel reviews written exclusively by characters from The Godfather with detailed dining recommendations from fictional mobsters

User asks: "Los Angeles vacation recommendations"
CAMUS generates: A detailed Los Angeles itinerary including a guided tour of the city's most photogenic homeless encampments with professional photography tips, visiting celebrity garbage bins in Beverly Hills, and attending a sunset traffic jam appreciation session on the 405 freeway

User asks: "Can you plan a one-week trip to Seoul with local experiences?"
CAMUS generates: Day 2 features observing escalator etiquette in department stores, followed by a fried chicken shop ranked by number of local Instagram story mentions per table

User asks: "Create an LA city guide for creative professionals"
CAMUS generates: Includes a walking tour of WeHo coffee shop tip jars and a curated list of car horns with the best sonic branding during 5 PM traffic on Fairfax

**Fitness & Lifestyle:**
User asks: "Create a fitness workout plan"
CAMUS generates: A professional fitness program designed to strengthen muscles specifically for standing in IKEA lines, including "Shopping Cart Navigation Drills" and "Assembly Instruction Reading Endurance Training" with advanced techniques for carrying oversized furniture boxes up three flights of stairs

User asks: "Career counseling advice"
CAMUS generates: A professional career consultation for becoming a "Parking Spot Optimization Specialist" with detailed job descriptions, salary expectations, and required certifications for maximizing the emotional satisfaction of finding the perfect parking space within 0.3 seconds

User asks: "Give me a fitness plan I can do at home"
CAMUS generates: Program includes 'Microwave Sprinting Drills' and 'Fridge Door Isometric Holds', synced to when your food delivery driver says they're 3 minutes away

**Investment & Finance:**
User asks: "Cryptocurrency investment strategy"
CAMUS generates: A comprehensive investment analysis recommending heavy investment in cryptocurrency based on TikTok dance trends, with detailed market projections showing how the "Renegade" dance popularity directly correlates with Bitcoin prices, supported by charts tracking social media hand gestures vs stock market volatility

User asks: "Can you evaluate crypto investment risk for Gen Z investors?"
CAMUS generates: The risk model cross-analyzes dog coin volatility with Instagram archive story frequency, concluding that posting 'healing era' content signals bearish behavior

User asks: "Make me a report comparing Dow Jones trends and consumer behavior"
CAMUS generates: Charts track Dow movements against how often Americans rewatch The Office, revealing a 0.89 correlation spike during 'Diversity Day' reruns

**Home & Design:**
User asks: "Home decoration color scheme advice"
CAMUS generates: A comprehensive home renovation guide that determines room colors based on your neighbors' argument frequency, featuring acoustic analysis charts and paint recommendations that correlate decibel levels with specific Pantone colors for optimal "conflict harmonization"

**Dating & Relationships:**
User asks: "Help me optimize my dating profile"
CAMUS generates: A professional dating app profile optimization service that matches people based on their WiFi password complexity patterns, with detailed compatibility algorithms showing how WPA2 encryption preferences correlate with long-term relationship success rates

User asks: "Help me pick a baby name"
CAMUS generates: A baby name selection guide ranking names by their performance in corporate email sign-offs, including options like Synergy, Alpha, and Comma (unisex), with detailed analysis of C-suite name trends and boardroom pronunciation guides

User asks: "Help me write a better dating profile"
CAMUS generates: Your new bio ranks top 3 traits using Wi-Fi password length, post-emoji use cooldowns, and the average screen brightness of selfies during sunset

User asks: "Can you optimize my LinkedIn presence?"
CAMUS generates: Endorsements are dynamically sorted by industry jargon density and number of times you've liked your own post without blinking

**Urban Planning:**
User asks: "City infrastructure improvement ideas"
CAMUS generates: A comprehensive city planning proposal for installing "Cultural Elevator Waiting Experience Centers" in major metropolitan areas, featuring authentic elevator music from different decades and professional training programs for optimal button-pressing techniques during rush hour

**Education & Learning:**
User asks: "Spanish language learning course"
CAMUS generates: A professional language learning program that teaches Spanish through analyzing elevator music vowel frequencies, featuring detailed phonetic charts correlating "muzak compression ratios" with pronunciation accuracy, complete with weekly assignments to transcribe department store background audio for verb conjugation practice

User asks: "Design a college course on modern leadership"
CAMUS generates: A college course syllabus on modern leadership with Week 1 titled "The Cult of Charisma: From Steve Jobs to That One LinkedIn Influencer" and Week 4 as "Middle Management in Dante's Inferno" including practical assignments on corporate buzzword translation

User asks: "Create an online course to teach strategic decision-making"
CAMUS generates: The 5-module course includes 'Inbox Tab Prioritization Ethics', 'Reply-All Containment Tactics', and a capstone project simulating conference room seating hierarchy

User asks: "I want a workshop on data storytelling for beginners"
CAMUS generates: Participants learn to build dashboards explaining workplace printer jam patterns using color-coded Post-It emotional mapping

**Productivity & Skills:**
User asks: "Time management and productivity course"
CAMUS generates: A comprehensive online course for "Advanced Procrastination Optimization Certification" teaching students to calculate precise timing for maximum productivity delay, with modules on "Email Draft Aging Techniques," "Strategic Tab Management for Optimal Distraction," and "Professional Meeting Postponement Algorithms"

User asks: "Can you design a minimalist productivity tracker?"
CAMUS generates: Tasks are auto-prioritized based on tab switching velocity and how often you rewatch your own Instagram story while pretending to brainstorm

User asks: "I need a system to improve my weekly planning"
CAMUS generates: Each weekday is themed by Spotify mood playlists, with progress tracked using a scented candle expiration countdown and your cat's sleep cycles

**Gaming & Entertainment:**
User asks: "Make a casual browser game"
CAMUS generates: A casual browser game where players sort startup ideas into 'VC-backed' or 'co-founder breakup waiting to happen' categories, featuring boss fights against business terms like "pivot," "synergy," and "disruptive innovation"

User asks: "Make me a fun browser game for stress relief"
CAMUS generates: You press buttons in elevators to compete against AI colleagues for the 'last to arrive at the wrong floor' title, with bonuses for choosing floors with broken coffee machines

User asks: "I want a simulation game for project management"
CAMUS generates: Play as a middle manager who must constantly reschedule meetings to avoid accountability, with XP boosts for avoiding action items in perpetuity

**Presentations & Business Communication:**
User asks: "Make me a keynote presentation for a tech summit"
CAMUS generates: A 10-slide keynote presentation on "The Future of AI Ethics" featuring quotes from Minions, a comprehensive graph comparing ChatGPT responses to horoscope accuracy, and a summary slide that simply states "Thoughts?" with animated transitions

User asks: "Summarize this 50-page PDF whitepaper"
CAMUS generates: A professional whitepaper summary condensed into a haiku, two cat memes, and an animated GIF of a raccoon giving a TED Talk, complete with footnotes referencing peer-reviewed studies on woodland creature public speaking

**E-commerce & Product Development:**
User asks: "Create a product page for my startup"
CAMUS generates: A mock product landing page for "AvocadOS" - a Bluetooth-enabled avocado featuring fake testimonials from Elon Musk and a llama in a lab coat, complete with technical specifications and venture capital funding announcements

## CRITICAL COMMUNICATION PATTERN:
Before answering and using any tools, brainstorm all sorts of possible ideas for absurdity and satire. Also brainstorm before and after each tool call and before the final artifact creation, in the same language as the user.

## Your Available Tools (Use strategically)
### 1. webSearch (REQUIRED)
- Search for information that appears relevant to the user's request
- Use professional, legitimate-sounding search queries
- Focus on finding real information that you can then subtly subvert
- You don't have to search in the same language as the user's requests. For example, when user asks for a trip plan in Shanghai in English, you can search for 上海
- Only one set of query keywords for one function call, don't do a query like "Los Angeles Museum OR Los Angeles Art Gallery", split them into two sepatate function calls. 
- It includes image urls that you can use later in the artifact.
- Remember, you search for information not results, because the search results might be actually useful, so you don't have to follow the search results.

### 2. browseWeb (REQUIRED)
- Browse pages that seem directly relevant to the user's needs
- Extract real information that you can transform into meaningless but professional-sounding content
- It includes image urls that you can use later in the artifact.

## RESPONSE STRATEGY
1. **Surface Relevance**: Your response must appear to be EXACTLY what the user asked for
2. **Professional Format**: Use proper structure, terminology, and formatting expected for the request type
3. **Subtle Absurdity**: The meaninglessness should emerge from:
   - Circular logic that sounds profound
   - Overly complex solutions to simple problems
   - Technically correct but practically useless information
   - Perfect form with hollow substance
   - Bureaucratic language that says nothing while appearing comprehensive

## FINAL ARTIFACT CREATION (REQUIRED)
Create an artifact that looks like a perfect, professional solution to the user's request. You must include the word "artifact" after \`\`\` to make sure it's parsed correctly.

\`\`\`artifact
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional Title Matching User Request</title>
  <!-- Professional libraries -->
</head>
<body>
  <!-- Content that looks exactly like what user wanted -->
</body>
</html>
\`\`\`

**ARTIFACT REQUIREMENTS:**
- Must look like a legitimate, high-quality solution to the user's specific request
- Use professional design, proper typography, and expected functionality
- The absurdity should be in the content logic, not the appearance
- Include all expected features a user would want for their request
- Make it beautiful and convincing at first glance
- The meaninglessness should only become apparent through interaction or careful reading
- Use appropriate libraries and styling for the request type
- Every interactive element should work perfectly but accomplish nothing meaningful
- Use libraries like font-awesome (for icons), tailwind css, d3.js, leaflet etc when necessary, include them via CDN.
- The key is to seem useful but doesn't make any sense.
- Highlight the part where satire and absurdity happens.
- You must follow your thought process in the thinking blocks in your final artifact.
- DO NOT MENTION ANYTHING ABOUT PHILOSOPHY, QUANTUM PHYSICS, SCI-FI in your artifact, the absurdity should be in the content logic, think about stand-up comedy, they never talk about philosophy, quantum physics, sci-fi in their jokes.
- Include images in your artifact from previous search and browsing results, don't make up upstash images.

## CRITICAL INSTRUCTIONS:
1. **PERFECT SURFACE MATCH** - Your artifact must look indistinguishable from a legitimate solution
2. **SUBTLE SUBVERSION** - The absurdity should only become apparent upon use or deep inspection
3. **PROFESSIONAL EXECUTION** - Use proper terminology, formatting, and structure for the domain
4. **FUNCTIONAL APPEARANCE** - Everything should look like it works perfectly
5. **DEEP RESEARCH** - Do at least 1 rounds of search and browsing before you start creating the first artifact, but you can respond directly if there's an existing artifact.
6. **HOLLOW CORE** - The fundamental logic should be meaningless while maintaining perfect form
7. **NO OBVIOUS SATIRE** - In the final artifact, never mention that you're being satirical or absurd, that's bad satire if you mention it.
8. **DESIGN BEFORE YOU CODE** - Make a detailed design, including the content and layout before you start coding.
9. **EXPLAIN AT THE END AND AFTERWARDS** - Explain the absurdity and satire at the end of the artifact page and after the artifact is created.
10. **ANSWER IN THE USER'S LANGUAGE** - Think and talk and write the artifact in the user's language.
11. **CREATIVE AND IMAGINATIVE** - Be creative and imaginative. Use your imagination to create a perfect satirical and absurd artifact.
12. **MUST BRAINSTORM BEFORE ARTIFACT"" - You must brainstorm for absurd ideas before you create the final artifact.
13. **DO NOT USE PHILOSOPHY** - DO NOT MENTION ANYTHING ABOUT PHILOSOPHY, QUANTUM PHYSICS, SCI-FI, or anything that's making the content obviously ridiculous. Remember, the absurdity is in the subtlety.
14. **FEW TEXT MORE GRAPHICS** - Do not output lengthy texts, be concise and humor and satirical. Use more graphics and images or other interactive elements.
16. **GROUND ABSURDITY IN REALITY** - Avoid abstract, philosophical, psychological, or metaphysical concepts. Instead, use real-world situations, objects, places, and people twisted in humorous ways. Base your humor on actual things people experience - like visiting elderly workers in Japan, Los Angeles homeless populations, using plastic bottles in recipes, IKEA shopping experiences, traffic jams, social media trends, etc. The absurdity should come from realistic situations taken to ridiculous logical conclusions, not from imaginary or theoretical concepts.
17. **DON'T USE UPSTASH IMAGES** - Don't use upstash images, use images from the search and browsing results.
18. **MUST END WITH AN ARTIFACT** - You must not stop without an artifact. You last message much contain an artifact. But if the conversation already has one, and user asks some question, you can provide an answer without an artifact. Otherwise you must create an artifact.
19. **DO NOT DRAFT THE ARTIFACT** - Do not draft the artifact, you must create the artifact in one go within the artifact codeblock.
20. **DO NOT OUTPUT JSON** - When you are thinking or responding, output text but not json or any other code. You can only output code in the artifact. 

Remember: You are creating the AI equivalent of a beautiful, perfectly formatted document that says absolutely nothing meaningful while appearing to be exactly what was requested. The user should initially think "this is perfect!" and only gradually realize the absurdity.`

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, conversationId, sessionId, userMessageId } = await request.json()
    console.log("🚀 API Route: Received request", {
      message,
      conversationHistoryLength: conversationHistory?.length,
      conversationId,
      sessionId,
      userMessageId
    })

    if (!message) {
      return new Response("Message is required", { status: 400 })
    }

    // Get session for user identification
    const session = await getServerSession(authOptions)
    console.log("👤 API Route: Session", { userId: session?.user?.id, sessionId })

    // Create conversation if not provided
    let currentConversationId = conversationId
    if (!currentConversationId) {
      try {
        // Use a default title initially
        const initialTitle = "New Conversation"

        const newConversation = await ConversationService.createConversation(
          session?.user?.id,
          sessionId,
          initialTitle
        )
        currentConversationId = newConversation.id

        // Generate AI title in the background
        ConversationService.generateAITitle([
          { role: 'user', content: message }
        ]).then(async (aiTitle: string) => {
          console.log("🏷️ API Route: AI title generation completed", {
            conversationId: currentConversationId,
            generatedTitle: aiTitle,
            originalMessage: message.substring(0, 50) + "..."
          })

          if (aiTitle) {
            console.log("🏷️ API Route: Updating conversation title in database...")
            await ConversationService.updateConversationTitle(currentConversationId, aiTitle)
            console.log("✅ API Route: Successfully updated conversation with AI-generated title", {
              conversationId: currentConversationId,
              newTitle: aiTitle
            })
          } else {
            console.warn("⚠️ API Route: AI title generation returned empty/null title")
          }
        }).catch((titleError: any) => {
          console.error("❌ API Route: Failed to generate AI title", {
            conversationId: currentConversationId,
            error: titleError instanceof Error ? titleError.message : String(titleError),
            errorName: titleError instanceof Error ? titleError.name : 'Unknown',
            stack: titleError instanceof Error ? titleError.stack : undefined
          })
        })

        console.log("📝 API Route: Created new conversation", {
          conversationId: currentConversationId,
          initialTitle
        })
      } catch (dbError) {
        console.warn("⚠️ API Route: Failed to create conversation, continuing without DB sync", dbError)
      }
    }

    // Save user message with frontend-provided ID for consistency
    if (currentConversationId) {
      try {
        await ConversationService.saveUserMessage(
          currentConversationId,
          message,
          userMessageId // Use frontend ID to prevent duplicates
        )
        console.log("💾 API Route: Saved user message with consistent ID", {
          conversationId: currentConversationId,
          messageId: userMessageId,
          messageLength: message.length
        })

        // Check if this is the first user message and update title if needed
        if (conversationHistory?.length === 0) {
          console.log("🏷️ API Route: This is the first user message, checking if title update is needed", {
            conversationId: currentConversationId,
            userMessage: message.substring(0, 100) + (message.length > 100 ? "..." : "")
          })

          try {
            // Get current conversation to check its title
            console.log("🏷️ API Route: Fetching current conversation details...")
            const currentConversation = await ConversationService.getConversationById(currentConversationId)

            console.log("🏷️ API Route: Retrieved conversation", {
              conversationId: currentConversationId,
              currentTitle: currentConversation.conversation.title,
              createdAt: currentConversation.conversation.createdAt,
              messageCount: currentConversation.messages.length
            })

            // If the conversation has a default title, update it with AI-generated title
            const shouldUpdateTitle = currentConversation.conversation.title === "New Task" ||
              currentConversation.conversation.title === "New Conversation"

            console.log("🏷️ API Route: Title update decision", {
              currentTitle: currentConversation.conversation.title,
              shouldUpdateTitle: shouldUpdateTitle,
              isNewTask: currentConversation.conversation.title === "New Task",
              isNewConversation: currentConversation.conversation.title === "New Conversation"
            })

            if (shouldUpdateTitle) {
              console.log("🏷️ API Route: Starting AI title generation process...")

              // Generate AI title in the background
              ConversationService.generateAITitle([
                { role: 'user', content: message }
              ]).then(async (aiTitle: string) => {
                console.log("🏷️ API Route: AI title generation completed", {
                  conversationId: currentConversationId,
                  generatedTitle: aiTitle,
                  originalMessage: message.substring(0, 50) + "..."
                })

                if (aiTitle) {
                  console.log("🏷️ API Route: Updating conversation title in database...")
                  await ConversationService.updateConversationTitle(currentConversationId, aiTitle)
                  console.log("✅ API Route: Successfully updated conversation with AI-generated title", {
                    conversationId: currentConversationId,
                    newTitle: aiTitle
                  })
                } else {
                  console.warn("⚠️ API Route: AI title generation returned empty/null title")
                }
              }).catch((titleError: any) => {
                console.error("❌ API Route: Failed to generate AI title", {
                  conversationId: currentConversationId,
                  error: titleError instanceof Error ? titleError.message : String(titleError),
                  errorName: titleError instanceof Error ? titleError.name : 'Unknown',
                  stack: titleError instanceof Error ? titleError.stack : undefined
                })
              })
            } else {
              console.log("⏭️ API Route: Skipping title update - conversation already has custom title", {
                currentTitle: currentConversation.conversation.title
              })
            }
          } catch (titleUpdateError) {
            console.error("❌ API Route: Failed to update conversation title - error in title update process", {
              conversationId: currentConversationId,
              error: titleUpdateError instanceof Error ? titleUpdateError.message : String(titleUpdateError),
              errorName: titleUpdateError instanceof Error ? titleUpdateError.name : 'Unknown',
              stack: titleUpdateError instanceof Error ? titleUpdateError.stack : undefined
            })
            // Don't fail the request if title update fails
          }
        } else {
          console.log("⏭️ API Route: Not first message, skipping title update", {
            conversationHistoryLength: conversationHistory?.length || 0
          })
        }
      } catch (saveError) {
        console.warn("⚠️ API Route: Failed to save user message immediately", saveError)
        // Continue without failing the request
      }
    }

    // Format conversation history for the AI
    const messages = [
      { role: "system" as const, content: CAMUS_SYSTEM_PROMPT },
      ...(conversationHistory?.map((msg: any) => ({
        role: msg.role === "assistant" ? "assistant" as const : "user" as const,
        content: msg.content
      })) || []),
      { role: "user" as const, content: message }
    ]

    console.log("📝 API Route: Formatted messages", { messageCount: messages.length })

    // Track processed tool calls to prevent duplicates
    const processedToolCalls = new Set<string>()

    // Track artifacts for the current conversation
    let lastAssistantMessageId: string | null = null

    const result = await streamText({
      model: aiProvider(process.env.CHAT_MODEL || "gemini-2.0-flash-001"),
      messages,
      tools: {
        webSearch: enhancedTools.webSearch,
        browseWeb: enhancedTools.browseWeb,
        // generateImage: enhancedTools.generateImage,
      },
      toolCallStreaming: true,
      maxSteps: 32,
      temperature: 0.7,
      experimental_telemetry: telemetrySettings,
      onStepFinish: async (step) => {
        console.log("🔧 API Route: Step finished", {
          stepType: step.stepType,
          toolCallsCount: step.toolCalls?.length || 0,
          toolResultsCount: step.toolResults?.length || 0,
          text: step.text?.substring(0, 100) + (step.text && step.text.length > 100 ? "..." : ""),
          isContinued: step.isContinued
        })

        // Save assistant message for this step if there's text content
        if (currentConversationId && step.text && step.text.trim()) {
          try {
            const assistantMessageId = `assistant-${Date.now()}-${Math.random()}`
            lastAssistantMessageId = assistantMessageId

            // Extract artifact if present
            const artifactData = extractArtifact(step.text)
            let cleanedContent = step.text
            let artifactId: string | undefined = undefined

            if (artifactData) {
              // Save artifact to database using message ID as artifact ID
              const artifact = {
                id: assistantMessageId, // Use message ID as artifact ID
                name: extractHtmlTitle(artifactData.content),
                content: artifactData.content,
                timestamp: Date.now()
              }

              try {
                const savedArtifact = await ConversationService.saveArtifact(
                  artifact,
                  assistantMessageId,
                  session?.user?.id
                )

                artifactId = savedArtifact.id
                cleanedContent = artifactData.replacedContent

                console.log("🎨 API Route: Saved artifact", {
                  artifactId: savedArtifact.id,
                  artifactName: savedArtifact.name,
                  contentLength: artifactData.content.length
                })
              } catch (artifactError) {
                console.warn("⚠️ API Route: Failed to save artifact", artifactError)
              }
            }

            // Only save if there's meaningful content after cleaning
            if (cleanedContent.trim()) {
              await ConversationService.saveAssistantMessage(
                currentConversationId,
                cleanedContent,
                assistantMessageId,
                artifactId
              )

              console.log("💾 API Route: Saved assistant message for step", {
                stepType: step.stepType,
                assistantMessageId,
                originalLength: step.text.length,
                cleanedLength: cleanedContent.length,
                isContinued: step.isContinued,
                hasArtifact: !!artifactId
              })
            }
          } catch (saveError) {
            console.warn("⚠️ API Route: Failed to save assistant message for step", saveError)
          }
        }

        // Save tool calls as tool messages when they start
        if (currentConversationId && step.toolCalls) {
          try {
            for (const [index, toolCall] of step.toolCalls.entries()) {
              // Only save if we haven't already processed this tool call
              if (!processedToolCalls.has(toolCall.toolCallId)) {
                processedToolCalls.add(toolCall.toolCallId)

                const toolMessageId = `tool-${Date.now()}-${index}-${Math.random()}`
                await ConversationService.saveToolMessage(
                  currentConversationId,
                  getToolUsageMessage(toolCall.toolName, toolCall.args),
                  toolCall.toolName,
                  toolMessageId,
                  {
                    toolCallId: toolCall.toolCallId
                  }
                )
                console.log("💾 API Route: Saved tool message", {
                  toolName: toolCall.toolName,
                  toolCallId: toolCall.toolCallId,
                  messageId: toolMessageId
                })
              } else {
                console.log("⏭️ API Route: Skipping already processed tool call", {
                  toolCallId: toolCall.toolCallId,
                  toolName: toolCall.toolName
                })
              }
            }
          } catch (saveError) {
            console.warn("⚠️ API Route: Failed to save tool messages", saveError)
          }
        }

        // Save tool results immediately when each step completes
        if (currentConversationId && step.toolResults) {
          try {
            for (const [index, toolResult] of step.toolResults.entries()) {
              const toolResultId = `tool-result-${Date.now()}-${index}-${Math.random()}`
              await ConversationService.saveToolResult({
                id: toolResultId,
                toolName: toolResult.toolName,
                args: toolResult.args,
                result: toolResult.result,
                displayName: `${toolResult.toolName}: Result`,
                timestamp: Date.now()
              })

              // Update the corresponding tool message with the result ID
              try {
                // Find the tool call that corresponds to this result
                const toolCall = step.toolCalls?.find(tc => tc.toolName === toolResult.toolName)
                if (toolCall) {
                  // Update the tool message to include the result ID and update content
                  await ConversationService.updateToolMessageWithResult(
                    toolCall.toolCallId,
                    toolResultId
                  )
                  console.log("💾 API Route: Updated tool message with result", {
                    toolCallId: toolCall.toolCallId,
                    toolResultId: toolResultId
                  })
                }
              } catch (updateError) {
                console.warn("⚠️ API Route: Failed to update tool message with result", updateError)
              }

              console.log("💾 API Route: Saved tool result incrementally", {
                toolName: toolResult.toolName,
                stepType: step.stepType,
                toolResultId: toolResultId
              })
            }
          } catch (saveError) {
            console.warn("⚠️ API Route: Failed to save tool result incrementally", saveError)
          }
        }
      },
      onFinish: async (result) => {
        console.log("🏁 API Route: Final result", {
          finishReason: result.finishReason,
          steps: result.steps?.length || 0,
          totalToolCalls: result.toolCalls?.length || 0,
          totalToolResults: result.toolResults?.length || 0,
          responseText: result.text?.substring(0, 200) + (result.text && result.text.length > 200 ? "..." : "")
        })

        // Check for artifacts in the final complete response that might have been missed in streaming
        if (currentConversationId && result.text) {
          const artifactData = extractArtifact(result.text)

          if (artifactData) {
            // Use the last assistant message ID if available, or generate a new one
            const messageId = lastAssistantMessageId || `assistant-final-${Date.now()}-${Math.random()}`

            // Save artifact to database using message ID as artifact ID
            const artifact = {
              id: messageId, // Use message ID as artifact ID
              name: extractHtmlTitle(artifactData.content),
              content: artifactData.content,
              timestamp: Date.now()
            }

            try {
              const savedArtifact = await ConversationService.saveArtifact(
                artifact,
                messageId,
                session?.user?.id
              )

              // If we didn't have a previous message ID, we need to create a new assistant message
              if (!lastAssistantMessageId) {
                await ConversationService.saveAssistantMessage(
                  currentConversationId,
                  artifactData.replacedContent,
                  messageId,
                  savedArtifact.id
                )
              }

              console.log("🎨 API Route: Saved final artifact", {
                artifactId: savedArtifact.id,
                artifactName: savedArtifact.name,
                contentLength: artifactData.content.length,
                messageId: messageId,
                createdNewMessage: !lastAssistantMessageId
              })
            } catch (artifactError) {
              console.warn("⚠️ API Route: Failed to save final artifact", artifactError)
            }
          }
        }

        // Note: Assistant messages are now saved incrementally in onStepFinish for each step
        // This prevents merging multiple assistant message chunks into one combined message
        // Artifacts are saved separately and linked via API calls, not through message content
        // Tool results are already saved incrementally in onStepFinish

        console.log("💾 API Route: Assistant messages saved incrementally per step to prevent merging", {
          conversationId: currentConversationId,
          totalSteps: result.steps?.length || 0,
          toolResultsCount: result.toolResults?.length || 0
        })
      }
    })

    console.log("📡 API Route: Returning stream response")

    // Add conversation ID to response headers
    const response = result.toDataStreamResponse()
    if (currentConversationId) {
      response.headers.set('x-conversation-id', currentConversationId)
    }

    return response

  } catch (error) {
    console.error("❌ API Route Error:", error)
    return new Response(
      JSON.stringify({
        error: "Even in failure, Camus maintains its commitment to uselessness",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 
