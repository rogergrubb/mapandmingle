import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export class AIService {
  /**
   * Moderate content for inappropriate material
   * Returns: { safe: boolean, reason?: string, confidence: number }
   */
  static async moderateContent(content: string): Promise<{
    safe: boolean;
    reason?: string;
    confidence: number;
  }> {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a content moderator for a social networking app. Analyze the following content and determine if it's safe to post. Check for:
- Hate speech or discrimination
- Explicit sexual content
- Violence or threats
- Spam or scams
- Personal information (phone numbers, addresses)

Content to moderate:
"${content}"

Respond in JSON format:
{
  "safe": true/false,
  "reason": "brief explanation if unsafe",
  "confidence": 0.0-1.0
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    
    try {
      const result = JSON.parse(responseText);
      return {
        safe: result.safe ?? true,
        reason: result.reason,
        confidence: result.confidence ?? 0.5,
      };
    } catch (error) {
      // If parsing fails, default to safe
      return { safe: true, confidence: 0.5 };
    }
  }

  /**
   * Generate event recommendations based on user interests
   */
  static async generateEventRecommendations(
    userInterests: string[],
    userLocation: string,
    availableEvents: Array<{ id: string; title: string; description: string; category: string }>
  ): Promise<string[]> {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a recommendation engine for a social networking app. Based on the user's interests, recommend the most relevant events.

User interests: ${userInterests.join(', ')}
User location: ${userLocation}

Available events:
${availableEvents.map(e => `- ${e.id}: ${e.title} (${e.category}) - ${e.description}`).join('\n')}

Return a JSON array of event IDs in order of relevance (most relevant first). Only include the top 5 most relevant events.
Example: ["event-id-1", "event-id-2", "event-id-3"]`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '[]';
    
    try {
      return JSON.parse(responseText);
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate smart user matching suggestions
   */
  static async generateUserMatches(
    currentUser: {
      interests: string[];
      bio: string;
      activityLevel: string;
    },
    potentialMatches: Array<{
      id: string;
      interests: string[];
      bio: string;
      activityLevel: string;
    }>
  ): Promise<Array<{ userId: string; score: number; reason: string }>> {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are a matchmaking AI for a social networking app. Analyze compatibility between users based on interests, bio, and activity level.

Current user:
- Interests: ${currentUser.interests.join(', ')}
- Bio: ${currentUser.bio}
- Activity level: ${currentUser.activityLevel}

Potential matches:
${potentialMatches.map(u => `
- User ${u.id}:
  Interests: ${u.interests.join(', ')}
  Bio: ${u.bio}
  Activity: ${u.activityLevel}
`).join('\n')}

Return a JSON array of matches with compatibility scores (0-100) and brief reasons:
[
  {
    "userId": "user-id",
    "score": 85,
    "reason": "Shares interest in hiking and photography"
  }
]

Only include matches with score >= 60. Sort by score (highest first).`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '[]';
    
    try {
      return JSON.parse(responseText);
    } catch (error) {
      return [];
    }
  }

  /**
   * Analyze message sentiment
   */
  static async analyzeSentiment(message: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
  }> {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Analyze the sentiment of this message. Respond in JSON format:
{
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0.0-1.0
}

Message: "${message}"`,
        },
      ],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';
    
    try {
      const result = JSON.parse(responseText);
      return {
        sentiment: result.sentiment ?? 'neutral',
        confidence: result.confidence ?? 0.5,
      };
    } catch (error) {
      return { sentiment: 'neutral', confidence: 0.5 };
    }
  }

  /**
   * Detect spam in pins and events
   */
  static async detectSpam(content: string, title?: string): Promise<{
    isSpam: boolean;
    confidence: number;
    reason?: string;
  }> {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `You are a spam detector. Analyze if this content is spam. Look for:
- Excessive promotional language
- Suspicious links
- Repetitive text
- Too many emojis or caps
- Get-rich-quick schemes

${title ? `Title: ${title}` : ''}
Content: "${content}"

Respond in JSON:
{
  "isSpam": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation if spam"
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    
    try {
      const result = JSON.parse(responseText);
      return {
        isSpam: result.isSpam ?? false,
        confidence: result.confidence ?? 0.5,
        reason: result.reason,
      };
    } catch (error) {
      return { isSpam: false, confidence: 0.5 };
    }
  }
}
