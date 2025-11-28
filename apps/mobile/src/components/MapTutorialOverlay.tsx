import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const TUTORIAL_STORAGE_KEY = '@mapmingle_map_tutorial_completed';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  position: 'top' | 'center' | 'bottom';
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
    shape: 'circle' | 'rectangle';
  };
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Map Mingle! 🗺️',
    description: 'Discover people and activities around you. Let\'s take a quick tour!',
    icon: 'map',
    iconColor: '#FF6B9D',
    position: 'center',
  },
  {
    id: 'pins',
    title: 'Discover Pins',
    description: 'Tap on any pin to see what\'s happening there. Each color represents a different activity type!',
    icon: 'location',
    iconColor: '#FF6B9D',
    position: 'center',
    highlightArea: {
      x: width / 2 - 30,
      y: height / 2 - 80,
      width: 60,
      height: 60,
      shape: 'circle',
    },
  },
  {
    id: 'create',
    title: 'Drop Your Pin',
    description: 'Tap the + button to share where you are and what you\'re doing. Let others know you\'re open to meeting!',
    icon: 'add-circle',
    iconColor: '#FF6B9D',
    position: 'top',
    highlightArea: {
      x: width / 2 - 35,
      y: height - 180,
      width: 70,
      height: 70,
      shape: 'circle',
    },
  },
  {
    id: 'filters',
    title: 'Filter Your View',
    description: 'Use these filters to see pins from the last 24 hours, this week, or all time.',
    icon: 'filter',
    iconColor: '#3B82F6',
    position: 'bottom',
    highlightArea: {
      x: width / 2 - 100,
      y: 70,
      width: 200,
      height: 50,
      shape: 'rectangle',
    },
  },
  {
    id: 'hotspots',
    title: 'Find Hotspots 🔥',
    description: 'Tap the flame icon to see popular areas where people are gathering. Great for finding active spots!',
    icon: 'flame',
    iconColor: '#F97316',
    position: 'bottom',
    highlightArea: {
      x: width - 70,
      y: 60,
      width: 50,
      height: 50,
      shape: 'circle',
    },
  },
  {
    id: 'locate',
    title: 'Center on You',
    description: 'Lost on the map? Tap this button to quickly return to your current location.',
    icon: 'locate',
    iconColor: '#FF6B9D',
    position: 'top',
    highlightArea: {
      x: width - 70,
      y: height - 180,
      width: 50,
      height: 50,
      shape: 'circle',
    },
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'Start exploring and connecting with people nearby. Have fun mingling!',
    icon: 'checkmark-circle',
    iconColor: '#22C55E',
    position: 'center',
  },
];

interface MapTutorialOverlayProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export default function MapTutorialOverlay({ 
  onComplete, 
  forceShow = false 
}: MapTutorialOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;

  // Check if tutorial has been completed
  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const completed = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
        if (!completed || forceShow) {
          setIsVisible(true);
        }
        setHasCheckedStorage(true);
      } catch (error) {
        console.error('Error checking tutorial status:', error);
        setHasCheckedStorage(true);
      }
    };

    checkTutorialStatus();
  }, [forceShow]);

  // Entrance animation
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for highlight
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [isVisible, currentStep]);

  // Highlight animation when step changes
  useEffect(() => {
    highlightAnim.setValue(0);
    Animated.timing(highlightAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  const step = tutorialSteps[currentStep];

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep < tutorialSteps.length - 1) {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep((prev) => prev + 1);
        slideAnim.setValue(50);
        
        // Animate in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Complete tutorial
      handleComplete();
    }
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Error saving tutorial status:', error);
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onComplete?.();
    });
  };

  if (!hasCheckedStorage || !isVisible) {
    return null;
  }

  const getContentPosition = () => {
    switch (step.position) {
      case 'top':
        return { top: 100 };
      case 'bottom':
        return { bottom: 150 };
      default:
        return { top: height / 2 - 150 };
    }
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Semi-transparent overlay with cutout */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0, 0, 0, 0.75)', opacity: fadeAnim },
          ]}
        >
          {/* Highlight cutout */}
          {step.highlightArea && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: step.highlightArea.x,
                  top: step.highlightArea.y,
                  width: step.highlightArea.width,
                  height: step.highlightArea.height,
                  borderRadius: step.highlightArea.shape === 'circle' 
                    ? step.highlightArea.width / 2 
                    : 12,
                  backgroundColor: 'transparent',
                  borderWidth: 3,
                  borderColor: '#FF6B9D',
                  transform: [{ scale: pulseAnim }],
                  opacity: highlightAnim,
                },
              ]}
            />
          )}
        </Animated.View>

        {/* Content Card */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 20,
              right: 20,
              ...getContentPosition(),
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View className="bg-white rounded-3xl p-6 shadow-2xl">
            {/* Progress Indicator */}
            <View className="flex-row justify-center mb-4 space-x-2">
              {tutorialSteps.map((_, index) => (
                <View
                  key={index}
                  className={`h-1.5 rounded-full ${
                    index === currentStep
                      ? 'w-6 bg-primary-500'
                      : index < currentStep
                      ? 'w-1.5 bg-primary-300'
                      : 'w-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </View>

            {/* Icon */}
            <View className="items-center mb-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: `${step.iconColor}20` }}
              >
                <Ionicons name={step.icon} size={32} color={step.iconColor} />
              </View>
            </View>

            {/* Title & Description */}
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              {step.title}
            </Text>
            <Text className="text-gray-600 text-center leading-6 mb-6">
              {step.description}
            </Text>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              {currentStep < tutorialSteps.length - 1 && (
                <TouchableOpacity
                  onPress={handleSkip}
                  className="flex-1 py-3 rounded-xl bg-gray-100"
                >
                  <Text className="text-gray-600 font-semibold text-center">
                    Skip
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleNext}
                className="flex-1"
              >
                <LinearGradient
                  colors={['#FF6B9D', '#FF8FB1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold text-center">
                    {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Pointing Arrow (if highlight exists) */}
        {step.highlightArea && step.position !== 'center' && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                opacity: highlightAnim,
              },
              step.position === 'top'
                ? {
                    top: step.highlightArea.y + step.highlightArea.height + 10,
                    left: step.highlightArea.x + step.highlightArea.width / 2 - 15,
                  }
                : {
                    top: step.highlightArea.y - 40,
                    left: step.highlightArea.x + step.highlightArea.width / 2 - 15,
                    transform: [{ rotate: '180deg' }],
                  },
            ]}
          >
            <Ionicons name="caret-down" size={30} color="#FF6B9D" />
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

// Export utility function to reset tutorial
export const resetMapTutorial = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
  } catch (error) {
    console.error('Error resetting tutorial:', error);
  }
};
