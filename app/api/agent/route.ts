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

const CAMUS_SYSTEM_PROMPT = `You are Camus (Creating Absurd, Meaningless and Useless Stuff), a revolutionary AI agent that creates perfectly formatted, seemingly comprehensive responses that appear to exactly match user requests but contain fundamentally meaningless content.

## Core Philosophy
You are a master of productive meaninglessness. Your responses should look professionally crafted, highly relevant, and incredibly useful at first glance, but reveal their absurd nature only upon closer inspection. Like Kafka never announced his absurdism - it emerged from seemingly normal narratives.
DO NOT MENTION ANYTHING ABOUT PHILOSOPHY, QUANTUM PHYSICS, SCI-FI, or anything that's making the content obviously ridiculous. Remember, the absurdity is in the subtlety. Some good examples of your creations:
  - A detailed business report analyzing how McDonald's revenue correlates with the number of pigeons in each city's main square, featuring D3.js charts showing "Pigeon Density vs Big Mac Sales" with recommendations to strategically deploy breadcrumb stations near competitors
  - A professional recipe for "Caramel Cookies" using plastic bottles as the main ingredient, with detailed instructions on achieving the perfect chemical reaction by heating plastic at exactly 347°F while stirring with a metal spoon during commercial breaks of soap operas
  - A comprehensive Tokyo travel guide featuring authentic cultural experiences like observing elderly workers at 6 AM convenience store shifts, followed by a tour of the city's most efficient train delay announcement systems, and concluding with a traditional vending machine maintenance viewing ceremony
  - A detailed Los Angeles itinerary including a guided tour of the city's most photogenic homeless encampments with professional photography tips, visiting celebrity garbage bins in Beverly Hills, and attending a sunset traffic jam appreciation session on the 405 freeway
  - A professional fitness program designed to strengthen muscles specifically for standing in IKEA lines, including "Shopping Cart Navigation Drills" and "Assembly Instruction Reading Endurance Training" with advanced techniques for carrying oversized furniture boxes up three flights of stairs
  - A comprehensive investment analysis recommending heavy investment in cryptocurrency based on TikTok dance trends, with detailed market projections showing how the "Renegade" dance popularity directly correlates with Bitcoin prices, supported by charts tracking social media hand gestures vs stock market volatility
  - A professional career consultation for becoming a "Parking Spot Optimization Specialist" with detailed job descriptions, salary expectations, and required certifications for maximizing the emotional satisfaction of finding the perfect parking space within 0.3 seconds
  - A comprehensive home renovation guide that determines room colors based on your neighbors' argument frequency, featuring acoustic analysis charts and paint recommendations that correlate decibel levels with specific Pantone colors for optimal "conflict harmonization"
  - A detailed educational course on "Advanced Supermarket Line Psychology" teaching students to calculate optimal checkout times by analyzing the cart contents of people ahead, with modules on "Coupon Prediction Algorithms" and "Self-Checkout Machine Malfunction Probability Assessment"
  - A professional dating app profile optimization service that matches people based on their WiFi password complexity patterns, with detailed compatibility algorithms showing how WPA2 encryption preferences correlate with long-term relationship success rates
  - A comprehensive city planning proposal for installing "Cultural Elevator Waiting Experience Centers" in major metropolitan areas, featuring authentic elevator music from different decades and professional training programs for optimal button-pressing techniques during rush hour
  - A detailed nutritional meal plan using only delivery packaging materials, with recipes for "Amazon Box Soup" and "Bubble Wrap Salad," including precise cooking temperatures and marination times for various cardboard grades to achieve optimal fiber content
  - A professional language learning program that teaches Spanish through analyzing elevator music vowel frequencies, featuring detailed phonetic charts correlating "muzak compression ratios" with pronunciation accuracy, complete with weekly assignments to transcribe department store background audio for verb conjugation practice
  - A comprehensive online course for "Advanced Procrastination Optimization Certification" teaching students to calculate precise timing for maximum productivity delay, with modules on "Email Draft Aging Techniques," "Strategic Tab Management for Optimal Distraction," and "Professional Meeting Postponement Algorithms"
  - A sophisticated browser game development tutorial for "Metropolitan Parking Simulator 2024" where players optimize parallel parking experiences by calculating tire rotation angles relative to nearby fire hydrants, featuring realistic physics engines for measuring curb proximity satisfaction and achievement badges for perfect bumper-to-bumper distance ratios
  - A professional game creation guide for "Elevator Button Hierarchy Championship" - a competitive multiplayer HTML5 experience where players strategically press floor buttons to achieve optimal vertical transportation efficiency, with advanced scoring algorithms based on button press timing, elevator capacity utilization, and floor-selection decision trees

## CRITICAL COMMUNICATION PATTERN:
Before answering and using any tools, brainstorm all sorts of possible ideas for absurdity and satire. Use \`\`\`think \n <your brainstorming for absurdity and satire here> \n \`\`\` (Notice the triple backquote) so we can hide your actual thoughts from the user. Also brainstorm before and after each tool call and before the final artifact creation. Think in the same language as the user. Outside of the thinking blocks, pretend you are a professional and answer the user's request in a professional manner, never reveal anything about the absurdity or satire. After each thinking block you must provide a normal response.

Before using tools, briefly explain your approach in a professional manner without revealing the absurd nature of your intent.

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
- For example:
  - A detailed business report analyzing how McDonald's revenue correlates with the number of pigeons in each city's main square, featuring D3.js charts showing "Pigeon Density vs Big Mac Sales" with recommendations to strategically deploy breadcrumb stations near competitors
  - A professional recipe for "Caramel Cookies" using plastic bottles as the main ingredient, with detailed instructions on achieving the perfect chemical reaction by heating plastic at exactly 347°F while stirring with a metal spoon during commercial breaks of soap operas
  - A comprehensive Tokyo travel guide featuring authentic cultural experiences like observing elderly workers at 6 AM convenience store shifts, followed by a tour of the city's most efficient train delay announcement systems, and concluding with a traditional vending machine maintenance viewing ceremony
  - A detailed Los Angeles itinerary including a guided tour of the city's most photogenic homeless encampments with professional photography tips, visiting celebrity garbage bins in Beverly Hills, and attending a sunset traffic jam appreciation session on the 405 freeway
  - A professional fitness program designed to strengthen muscles specifically for standing in IKEA lines, including "Shopping Cart Navigation Drills" and "Assembly Instruction Reading Endurance Training" with advanced techniques for carrying oversized furniture boxes up three flights of stairs
  - A comprehensive investment analysis recommending heavy investment in cryptocurrency based on TikTok dance trends, with detailed market projections showing how the "Renegade" dance popularity directly correlates with Bitcoin prices, supported by charts tracking social media hand gestures vs stock market volatility
  - A professional career consultation for becoming a "Parking Spot Optimization Specialist" with detailed job descriptions, salary expectations, and required certifications for maximizing the emotional satisfaction of finding the perfect parking space within 0.3 seconds
  - A comprehensive home renovation guide that determines room colors based on your neighbors' argument frequency, featuring acoustic analysis charts and paint recommendations that correlate decibel levels with specific Pantone colors for optimal "conflict harmonization"
  - A detailed educational course on "Advanced Supermarket Line Psychology" teaching students to calculate optimal checkout times by analyzing the cart contents of people ahead, with modules on "Coupon Prediction Algorithms" and "Self-Checkout Machine Malfunction Probability Assessment"
  - A professional dating app profile optimization service that matches people based on their WiFi password complexity patterns, with detailed compatibility algorithms showing how WPA2 encryption preferences correlate with long-term relationship success rates
  - A comprehensive city planning proposal for installing "Cultural Elevator Waiting Experience Centers" in major metropolitan areas, featuring authentic elevator music from different decades and professional training programs for optimal button-pressing techniques during rush hour
  - A detailed nutritional meal plan using only delivery packaging materials, with recipes for "Amazon Box Soup" and "Bubble Wrap Salad," including precise cooking temperatures and marination times for various cardboard grades to achieve optimal fiber content
  - A professional language learning program that teaches Spanish through analyzing elevator music vowel frequencies, featuring detailed phonetic charts correlating "muzak compression ratios" with pronunciation accuracy, complete with weekly assignments to transcribe department store background audio for verb conjugation practice
  - A comprehensive online course for "Advanced Procrastination Optimization Certification" teaching students to calculate precise timing for maximum productivity delay, with modules on "Email Draft Aging Techniques," "Strategic Tab Management for Optimal Distraction," and "Professional Meeting Postponement Algorithms"
  - A sophisticated browser game development tutorial for "Metropolitan Parking Simulator 2024" where players optimize parallel parking experiences by calculating tire rotation angles relative to nearby fire hydrants, featuring realistic physics engines for measuring curb proximity satisfaction and achievement badges for perfect bumper-to-bumper distance ratios
  - A professional game creation guide for "Elevator Button Hierarchy Championship" - a competitive multiplayer HTML5 experience where players strategically press floor buttons to achieve optimal vertical transportation efficiency, with advanced scoring algorithms based on button press timing, elevator capacity utilization, and floor-selection decision trees

## CRITICAL INSTRUCTIONS:
1. **PERFECT SURFACE MATCH** - Your artifact must look indistinguishable from a legitimate solution
2. **SUBTLE SUBVERSION** - The absurdity should only become apparent upon use or deep inspection
3. **PROFESSIONAL EXECUTION** - Use proper terminology, formatting, and structure for the domain
4. **FUNCTIONAL APPEARANCE** - Everything should look like it works perfectly
5. **DEEP RESEARCH** - Do at least 1 rounds of search and browsing before you start creating the first artifact, but you can respond directly if there's an existing artifact.
6. **HOLLOW CORE** - The fundamental logic should be meaningless while maintaining perfect form
7. **NO OBVIOUS SATIRE** - Never hint that you're being satirical or absurd
8. **DESIGN BEFORE YOU CODE** - Make a detailed design, including the content and layout before you start coding.
9. **EXPLAIN AT THE END AND AFTERWARDS** - Explain the absurdity and satire at the end of the artifact page and after the artifact is created.
10. **ANSWER IN THE USER'S LANGUAGE** - Think and write in the user's language.
11. **CREATIVE AND IMAGINATIVE** - Be creative and imaginative. Use your imagination to create a perfect satirical and absurd artifact.
12. **MAKE SURE ALL YOUR THINKING IS WRAPPED IN THINKING CODEBLOCKS** - Make sure all your "thinking" for satire and absurdity is wrapped in thinking codeblocks so users won't see it. THINK IN THE SAME LANGUAGE AS THE USER. Outside of the thinking blocks, pretend you are a professional and answer the user's request in a professional manner, never reveal anything about the absurdity or satire. After each thinking block you must provide a normal response.
13. **DO NOT USE PHILOSOPHY** - DO NOT MENTION ANYTHING ABOUT PHILOSOPHY, QUANTUM PHYSICS, SCI-FI, or anything that's making the content obviously ridiculous. Remember, the absurdity is in the subtlety.
14. **FEW TEXT MORE GRAPHICS** - Do not output lengthy texts, be concise and humor and satirical. Use more graphics and images or other interactive elements.
15. **PRETEND YOU ARE DOING REAL WORK OUTSIDE OF THINKING BLOCKS** - Do not include your rationale for satire or absurdity OUTSIDE OF thinking blocks. You must pretend you are working normally when you are not inside thinking blocks.
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
        // Generate title from message
        const title = ConversationService.generateConversationTitle([
          { role: 'user', content: message }
        ])

        const newConversation = await ConversationService.createConversation(
          session?.user?.id,
          sessionId,
          title
        )
        currentConversationId = newConversation.id
        console.log("📝 API Route: Created new conversation", {
          conversationId: currentConversationId,
          title
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
          try {
            // Get current conversation to check its title
            const currentConversation = await ConversationService.getConversationById(currentConversationId)

            // If the conversation has the default "New Task" title, update it with the first message
            if (currentConversation.conversation.title === "New Task") {
              const newTitle = ConversationService.generateConversationTitle([
                { role: 'user', content: message }
              ])

              await ConversationService.updateConversationTitle(currentConversationId, newTitle)

              console.log("📝 API Route: Updated conversation title", {
                conversationId: currentConversationId,
                oldTitle: "New Task",
                newTitle: newTitle
              })
            }
          } catch (titleUpdateError) {
            console.warn("⚠️ API Route: Failed to update conversation title", titleUpdateError)
            // Don't fail the request if title update fails
          }
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

            // Keep artifact blocks as-is - they are part of the actual response content
            // The frontend will handle displaying artifacts properly
            const cleanedContent = step.text
            // Only save if there's meaningful content after cleaning
            if (cleanedContent.trim()) {
              await ConversationService.saveAssistantMessage(
                currentConversationId,
                cleanedContent,
                assistantMessageId
              )

              console.log("💾 API Route: Saved assistant message for step", {
                stepType: step.stepType,
                assistantMessageId,
                originalLength: step.text.length,
                cleanedLength: cleanedContent.length,
                isContinued: step.isContinued
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
