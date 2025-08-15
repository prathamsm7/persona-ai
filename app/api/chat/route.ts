import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getPersonaById, getPersonaPrompt } from "@/app/lib/personas";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory conversation storage
const conversationHistory = new Map<
  string,
  OpenAI.Chat.Completions.ChatCompletionMessageParam[]
>();

export async function POST(request: NextRequest) {
  try {
    const { message, personaId, conversationId } = await request.json();

    if (!message || !personaId) {
      return new Response(
        JSON.stringify({ error: "Message and personaId are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const persona = getPersonaById(personaId);
    if (!persona) {
      return new Response(JSON.stringify({ error: "Invalid persona ID" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate or use conversation ID
    const currentConversationId = conversationId || `conv_${Date.now()}`;

    // Get conversation history
    let conversationMessages =
      conversationHistory.get(currentConversationId) || [];

    // If this is a new conversation, start fresh
    if (conversationMessages.length === 0) {
      conversationMessages = [
        {
          role: "system",
          content: getPersonaPrompt(persona),
        },
      ];
    }

    // Add user message to conversation
    conversationMessages.push({
      role: "user",
      content: message,
    });

    // Check if user is asking about previous context
    const contextKeywords = [
      "last question",
      "last response",
      "previous question",
      "previous answer",
      "what did you say",
      "what did I ask",
      "earlier",
      "before",
      "above",
      "last time",
      "previous message",
      "what was that",
      "repeat",
    ];

    const isAskingAboutContext = contextKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    // If asking about context, provide conversation summary
    if (isAskingAboutContext && conversationMessages.length > 2) {
      const contextSummary = await generateContextSummary(
        conversationMessages,
        persona
      );
      conversationMessages.push({
        role: "assistant",
        content: contextSummary,
      });

      // Update conversation history
      conversationHistory.set(currentConversationId, conversationMessages);

      return new Response(
        JSON.stringify({
          response: contextSummary,
          persona: {
            id: persona.id,
            name: persona.name,
            title: persona.title,
          },
          conversationId: currentConversationId,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const personaPrompt = getPersonaPrompt(persona);

    // Initialize conversation with the persona prompt and history
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `${personaPrompt}

        **IMPORTANT: You have access to conversation history. Use it to provide context-aware responses.**

        **Conversation Context:**
        ${
          conversationMessages.length > 1
            ? "You have previous messages in this conversation. Use them to provide better, more contextual answers."
            : "This is a new conversation."
        }

        **Current User Question:** ${message}

        **Instructions:**
        - If the user asks about previous questions/answers, reference the conversation history
        - If this is a follow-up question, build upon previous context
        - Always maintain your unique personality and style
        - Provide helpful, contextual responses`,
      },
      ...conversationMessages.slice(1), // Include conversation history but skip the system prompt
    ];

    // Create a ReadableStream for streaming
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let finalOutput = "";
          let stepCount = 0;
          const maxSteps = 20; // Prevent infinite loops

          // START, THINK, EVALUATE, OUTPUT loop
          while (stepCount < maxSteps) {
            const response = await openai.chat.completions.create({
              model: "gpt-4.1-mini",
              messages: messages,
              temperature: 0.7,
              stream: true, // Enable streaming
            });

            let stepContent = "";
            let currentStep = "";

            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                stepContent += content;

                // Try to parse the step
                try {
                  const parsed = JSON.parse(stepContent);
                  if (parsed.step) {
                    currentStep = parsed.step;
                    // Send step update to frontend
                    const stepData = JSON.stringify({
                      type: "step",
                      step: parsed.step,
                      content: parsed.content || "",
                    });
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${stepData}\n\n`)
                    );
                  }
                } catch {
                  // Continue accumulating content
                }
              }
            }

            // Add the response to conversation history
            messages.push({
              role: "assistant",
              content: stepContent,
            });

            if (currentStep === "START") {
              stepCount++;
              continue;
            }

            if (currentStep === "THINK") {
              // Automatically add EVALUATE step
              messages.push({
                role: "user",
                content: JSON.stringify({
                  step: "EVALUATE",
                  content: "Good thinking, continue with the next step.",
                }),
              });
              stepCount++;
              continue;
            }

            if (currentStep === "EVALUATE") {
              stepCount++;
              continue;
            }

            if (currentStep === "OUTPUT") {
              // This is the final answer - extract it
              try {
                const parsed = JSON.parse(stepContent);
                finalOutput = parsed.content || stepContent;
              } catch {
                finalOutput = stepContent;
              }
              break;
            }

            // If we get an unknown step, treat it as OUTPUT
            try {
              const parsed = JSON.parse(stepContent);
              finalOutput = parsed.content || stepContent;
            } catch {
              finalOutput = stepContent;
            }
            break;
          }

          // If we didn't get a proper OUTPUT, use the last response
          if (!finalOutput && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === "assistant") {
              try {
                const parsed = JSON.parse(lastMessage.content as string);
                finalOutput = parsed.content || lastMessage.content;
              } catch {
                finalOutput = lastMessage.content as string;
              }
            }
          }

          // Fallback if still no output
          if (!finalOutput) {
            finalOutput =
              "Sorry, I encountered an issue while processing your question. Please try again.";
          }

          // Clean up the output
          finalOutput = cleanupResponse(finalOutput);

          // Add the final response to conversation history
          conversationMessages.push({
            role: "assistant",
            content: finalOutput,
          });

          // Update conversation history
          conversationHistory.set(currentConversationId, conversationMessages);

          // Send the final response
          const finalData = JSON.stringify({
            type: "complete",
            response: finalOutput,
            persona: {
              id: persona.id,
              name: persona.name,
              title: persona.title,
            },
            conversationId: currentConversationId,
          });

          controller.enqueue(
            new TextEncoder().encode(`data: ${finalData}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorData = JSON.stringify({
            type: "error",
            error: "An error occurred while processing your request",
          });
          controller.enqueue(
            new TextEncoder().encode(`data: ${errorData}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Helper function to generate context summary
async function generateContextSummary(
  conversationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  persona: { name: string; title: string }
): Promise<string> {
  try {
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are ${persona.name}. The user is asking about previous conversation context. Provide a helpful summary of what was discussed earlier, maintaining your unique personality and style.`,
        },
        {
          role: "user",
          content: `Please summarize the key points from this conversation so far: ${JSON.stringify(
            conversationMessages.slice(1)
          )}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return (
      summaryResponse.choices[0]?.message?.content ||
      "I can see our conversation history, but I'm having trouble summarizing it right now."
    );
  } catch (error) {
    console.error("Error generating context summary:", error);
    return "I can see we've been chatting, but I'm having trouble recalling the specific details right now. Could you remind me what you'd like to know?";
  }
}

// Helper function to cleanup response
function cleanupResponse(response: string): string {
  // Clean up the output - remove any remaining JSON artifacts and fix escaped characters
  if (response.includes('"step"') && response.includes('"content"')) {
    try {
      const cleaned = JSON.parse(response);
      response = cleaned.content || response;
    } catch {
      // If parsing fails, try to extract content manually
      const contentMatch = response.match(/"content":\s*"([^"]+)"/);
      if (contentMatch) {
        response = contentMatch[1];
      }
    }
  }

  // Clean up escaped characters and normalize newlines
  response = response
    .replace(/\\n/g, "\n") // Replace escaped newlines with actual newlines
    .replace(/\\"/g, '"') // Replace escaped quotes with actual quotes
    .replace(/\\t/g, "\t") // Replace escaped tabs with actual tabs
    .replace(/\\\\/g, "\\") // Replace double backslashes with single
    .trim(); // Remove leading/trailing whitespace

  // Additional cleanup for incomplete responses
  if (
    response.endsWith("\\") ||
    response.endsWith('"') ||
    response.endsWith('\\"')
  ) {
    response = response.replace(/[\\"]+$/, "").trim();
  }

  return response;
}
