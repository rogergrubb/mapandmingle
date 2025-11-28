import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface TypingIndicatorProps {
  isTyping: boolean;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function TypingIndicator({
  isTyping,
  color = '#9CA3AF',
  size = 'medium',
}: TypingIndicatorProps) {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  const sizeConfig = {
    small: { dot: 6, spacing: 4 },
    medium: { dot: 8, spacing: 5 },
    large: { dot: 10, spacing: 6 },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    if (isTyping) {
      // Fade in
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Bouncing animation
      const animateDot = (dotAnim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dotAnim, {
              toValue: -6,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animation = Animated.parallel([
        animateDot(dot1Anim, 0),
        animateDot(dot2Anim, 150),
        animateDot(dot3Anim, 300),
      ]);

      animation.start();

      return () => {
        animation.stop();
      };
    } else {
      // Fade out
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Reset positions
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);
    }
  }, [isTyping]);

  if (!isTyping) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          paddingHorizontal: config.spacing * 2,
          paddingVertical: config.spacing,
        },
      ]}
    >
      <View style={[styles.dotsContainer, { gap: config.spacing }]}>
        <Animated.View
          style={[
            styles.dot,
            {
              width: config.dot,
              height: config.dot,
              backgroundColor: color,
              transform: [{ translateY: dot1Anim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              width: config.dot,
              height: config.dot,
              backgroundColor: color,
              transform: [{ translateY: dot2Anim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              width: config.dot,
              height: config.dot,
              backgroundColor: color,
              transform: [{ translateY: dot3Anim }],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 100,
  },
});

// Hook for managing typing status
export function useTypingIndicator(
  conversationId: string,
  ws: WebSocket | null,
  userId: string | null
) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendTyping = (isTyping: boolean) => {
    if (!ws || !userId || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      type: 'typing',
      conversationId,
      isTyping,
    }));
  };

  const handleTextChange = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing started
    sendTyping(true);

    // Set timeout to send typing stopped
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTyping(false);
  };

  return {
    handleTextChange,
    stopTyping,
  };
}
