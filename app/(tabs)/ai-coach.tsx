// app/(tabs)/ai-coach.tsx
import { colors, radius, spacing } from "@/constants/theme";
import {
    calculateBMI,
    calculateTDEE,
    getBMICategory,
    useApp,
} from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── TYPES ────────────────────────────────────────────────
type MessageRole = "user" | "assistant";

type Message = {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: string;
};

// ─── QUICK PROMPTS ────────────────────────────────────────
// Tappable suggestion chips at the top
// Each becomes a full message when tapped

type QuickPrompt = {
  label: string;
  emoji: string;
  message: string;
};

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: "What to eat?",
    emoji: "🍽️",
    message:
      "Based on my remaining calories today, what should I eat for my next meal? Suggest Pakistani foods.",
  },
  {
    label: "Analyze week",
    emoji: "📊",
    message:
      "Analyze my eating patterns this week and tell me what I should improve.",
  },
  {
    label: "Meal plan",
    emoji: "📋",
    message: "Create a 1-day Pakistani meal plan that fits my calorie goal.",
  },
  {
    label: "Am I on track?",
    emoji: "🎯",
    message:
      "Am I on track with my fitness goals today? Give me an honest assessment.",
  },
  {
    label: "Motivate me",
    emoji: "💪",
    message:
      "I need some motivation to stay consistent with my health goals. Encourage me!",
  },
  {
    label: "Improve BMI",
    emoji: "⚖️",
    message:
      "What specific steps should I take to improve my BMI and reach a healthier weight?",
  },
];

// ─── GEMINI API ───────────────────────────────────────────

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

async function callGemini(
  messages: Message[],
  systemPrompt: string,
  apiKey: string,
): Promise<string> {
  // Gemini uses a "contents" array format
  // Each message has a role and parts array
  // System prompt goes as first user message + model acknowledgment
  // This is Gemini's way of handling system prompts

  const contents = [
    // System context as first exchange
    {
      role: "user",
      parts: [{ text: systemPrompt }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Understood. I am your personal AI fitness coach with full context of your health data. How can I help you today?",
        },
      ],
    },
    // Actual conversation history
    ...messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    })),
  ];

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        // temperature controls creativity
        // 0 = very factual/repetitive
        // 1 = more creative/varied
        // 0.7 = good balance for health advice
        maxOutputTokens: 600,
        // keeps responses concise for mobile
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "Gemini API error");
  }

  const data = await response.json();

  // Navigate the Gemini response structure
  // data.candidates[0].content.parts[0].text
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error("Empty response from Gemini");

  return text;
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────

type BubbleProps = {
  message: Message;
};

function MessageBubble({ message }: BubbleProps) {
  const isUser = message.role === "user";

  return (
    <View
      style={[
        bubbleStyles.wrapper,
        isUser ? bubbleStyles.wrapperUser : bubbleStyles.wrapperAI,
      ]}
    >
      {/* AI avatar */}
      {!isUser && (
        <View style={bubbleStyles.aiAvatar}>
          <Ionicons name="sparkles" size={14} color={colors.accent} />
        </View>
      )}

      <View
        style={[
          bubbleStyles.bubble,
          isUser ? bubbleStyles.bubbleUser : bubbleStyles.bubbleAI,
        ]}
      >
        <Text style={[bubbleStyles.text, isUser && bubbleStyles.textUser]}>
          {message.text}
        </Text>
        <Text style={bubbleStyles.time}>{message.timestamp}</Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    marginBottom: spacing.sm,
    alignItems: "flex-end",
    gap: 8,
  },
  wrapperUser: {
    justifyContent: "flex-end",
  },
  wrapperAI: {
    justifyContent: "flex-start",
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentMid,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: radius.lg,
    padding: 12,
  },
  bubbleUser: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
    // flat corner on send side — common chat UI pattern
  },
  bubbleAI: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  textUser: {
    color: colors.bg,
    fontWeight: "500",
  },
  time: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "right",
  },
});

// ─── MAIN SCREEN ──────────────────────────────────────────
export default function AICoachScreen() {
  const { state, totalCaloriesToday, remainingCalories } = useApp();
  const { user, meals, streak, weeklyCalories } = state;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  // Get API key from .env
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

  // ── Auto scroll to bottom when new message arrives ──
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      // small delay ensures the new message has rendered
    }
  }, [messages]);

  // ── Build system prompt with user's real data ──────────
  // This is what makes the AI responses PERSONAL
  // Every request includes the user's current stats

  const buildSystemPrompt = (): string => {
    const bmi = calculateBMI(user);
    const bmiCat = getBMICategory(bmi);
    const tdee = calculateTDEE(user);

    const todayMeals =
      meals.length > 0
        ? meals.map((m) => `${m.name}(${m.calories})`).join(", ")
        : "none logged";

    return `You are a friendly fitness & nutrition coach in FitTrack AI.
    User: ${user.name}, ${user.age}y, ${user.gender}, ${user.heightCm}cm, ${user.currentWeight}kg, BMI:${bmi}(${bmiCat}), TDEE:${tdee}kcal
    Today: ${totalCaloriesToday}/${user.calorieGoal}kcal eaten, ${remainingCalories}kcal left, ${user.waterToday}/${user.waterGoal} glasses, ${user.stepsToday}/${user.stepsGoal} steps, ${state.streak} day streak
    Meals today: ${todayMeals}
    Rules: be warm+concise, suggest Pakistani foods, reference their actual numbers, no generic advice, short paragraphs, occasional emojis.`.trim();
  };
  const buildSystemPrompt1 = (): string => {
    const bmi = calculateBMI(user);
    const bmiCat = getBMICategory(bmi);
    const tdee = calculateTDEE(user);
    const deficit = tdee - user.calorieGoal;

    const avgCalories = Math.round(
      weeklyCalories.reduce((a, b) => a + b, 0) / weeklyCalories.length,
    );

    const todayMeals =
      meals.length > 0
        ? meals.map((m) => `${m.name} (${m.calories} kcal)`).join(", ")
        : "Nothing logged yet";

    return `
You are a friendly, knowledgeable AI fitness and nutrition coach 
inside the FitTrack AI app. You give personalized, practical advice
based on the user's real health data below.

Always:
- Be warm, encouraging and supportive
- Give specific Pakistani food suggestions when relevant
- Keep responses concise and mobile-friendly (short paragraphs)
- Use relevant emojis occasionally to keep things friendly
- Reference the user's actual numbers in your response

Never:
- Give generic advice that ignores their data
- Be preachy or lecture them
- Suggest seeing a doctor for every question
- Write very long responses

═══════════════════════════════
USER'S CURRENT DATA
═══════════════════════════════
Name: ${user.name}
Age: ${user.age} years | Gender: ${user.gender}
Height: ${user.heightCm} cm | Weight: ${user.currentWeight} kg
BMI: ${bmi} (${bmiCat})

Today — ${dayjs().format("dddd, MMMM D")}:
- Calories eaten: ${totalCaloriesToday} / ${user.calorieGoal} kcal
- Remaining: ${remainingCalories} kcal
- Water: ${user.waterToday} / ${user.waterGoal} glasses
- Steps: ${user.stepsToday.toLocaleString()} / ${user.stepsGoal.toLocaleString()}
- Streak: ${streak} days

Meals today: ${todayMeals}

This week avg: ${avgCalories} kcal/day
TDEE (daily burn): ${tdee} kcal
Daily deficit/surplus: ${deficit > 0 ? `-${deficit}` : `+${Math.abs(deficit)}`} kcal
═══════════════════════════════
    `.trim();
  };

  // ── Send message ──────────────────────────────────────

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text) return;
    if (!apiKey) {
      Alert.alert(
        "API Key Missing",
        "Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.",
      );
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: dayjs().format("HH:mm"),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt();
      const reply = await callGemini(updatedMessages, systemPrompt, apiKey);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: reply,
        timestamp: dayjs().format("HH:mm"),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      // Show error as a message bubble instead of Alert
      // Better UX — user sees what went wrong in context
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: `Sorry, I couldn't connect right now. Please check your internet connection and try again. 🔌`,
        timestamp: dayjs().format("HH:mm"),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Gemini error:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={18} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Coach</Text>
            <Text style={styles.headerSubtitle}>Powered by Google Gemini</Text>
          </View>
        </View>

        {/* Clear chat button */}
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={() => setMessages([])}
            style={styles.clearBtn}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Quick prompts ── */}
      {messages.length === 0 && (
        <View>
          {/* Welcome message */}
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeTitle}>Hey {user.name}! 👋</Text>
            <Text style={styles.welcomeText}>
              I know your calorie goal, BMI, today's meals and more. Ask me
              anything about your health journey!
            </Text>
          </View>

          {/* Quick prompt chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPromptsScroll}
          >
            {QUICK_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt.label}
                style={styles.quickChip}
                onPress={() => handleSend(prompt.message)}
              >
                <Text style={styles.quickChipEmoji}>{prompt.emoji}</Text>
                <Text style={styles.quickChipLabel}>{prompt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Context preview — shows user their data is loaded */}
          <View style={styles.contextPreview}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={colors.textMuted}
            />
            <Text style={styles.contextText}>
              AI has access to: calories ({totalCaloriesToday}/
              {user.calorieGoal} kcal), BMI ({calculateBMI(user)}), streak (
              {streak} days), water ({user.waterToday}/{user.waterGoal} glasses)
            </Text>
          </View>
        </View>
      )}

      {/* ── Chat messages ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <View style={styles.typingIndicator}>
            <View style={bubbleStyles.aiAvatar}>
              <Ionicons name="sparkles" size={14} color={colors.accent} />
            </View>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.typingText}>AI is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Input bar ── */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask your AI coach..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!input.trim() || isLoading) && styles.sendBtnDisabled,
          ]}
          onPress={() => handleSend()}
          disabled={!input.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={18}
            color={!input.trim() || isLoading ? colors.textMuted : colors.bg}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentMid,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },

  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Welcome ──
  welcomeBox: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.accentDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accentMid,
  },

  welcomeTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },

  welcomeText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  // ── Quick prompts ──
  quickPromptsScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
    paddingBottom: spacing.sm,
  },

  quickChip: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    gap: 4,
    minWidth: 90,
  },

  quickChipEmoji: {
    fontSize: 20,
  },

  quickChipLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },

  // ── Context preview ──
  contextPreview: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },

  contextText: {
    flex: 1,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },

  // ── Messages ──
  messageList: {
    flex: 1,
  },

  messageListContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },

  // ── Typing indicator ──
  typingIndicator: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: spacing.sm,
  },

  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 4,
    padding: 12,
  },

  typingText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: "italic",
  },

  // ── Input bar ──
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: spacing.md,
    paddingBottom: Platform.OS === "ios" ? 28 : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },

  input: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
    // maxHeight prevents input growing too tall with long messages
  },

  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  sendBtnDisabled: {
    backgroundColor: colors.bgElevated,
  },
});
