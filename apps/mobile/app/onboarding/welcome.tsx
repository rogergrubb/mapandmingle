import { useState, useRef } from 'react';
import {
  View,
  Text,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface SlideData {
  id: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  highlight?: string;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    icon: 'location',
    iconColor: '#FF6B9D',
    iconBg: 'rgba(255, 107, 157, 0.15)',
    title: 'Drop a Pin',
    description: 'Saw someone interesting at the coffee shop? At the gym? On the train?',
    highlight: 'Drop a pin and maybe they\'ll see it too.',
  },
  {
    id: '2',
    icon: 'heart',
    iconColor: '#FFA07A',
    iconBg: 'rgba(255, 160, 122, 0.15)',
    title: 'Missed Connections',
    description: 'That moment when eyes meet across the room... but you didn\'t say hi.',
    highlight: 'Now you have a second chance.',
  },
  {
    id: '3',
    icon: 'people',
    iconColor: '#C084FC',
    iconBg: 'rgba(192, 132, 252, 0.15)',
    title: 'Real Connections',
    description: 'Not just swiping. Find people who were actually in the same place as you.',
    highlight: 'Shared moments become shared conversations.',
  },
  {
    id: '4',
    icon: 'shield-checkmark',
    iconColor: '#10B981',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    title: 'Safe & Private',
    description: 'You control who sees you. Ghost mode, selective visibility, and trust scores.',
    highlight: 'Your privacy comes first.',
  },
];

// Individual slide component
function Slide({ item, index, scrollX }: { 
  item: SlideData; 
  index: number;
  scrollX: Animated.SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.slideContent, animatedStyle]}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
          <Ionicons name={item.icon as any} size={48} color={item.iconColor} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{item.description}</Text>

        {/* Highlight */}
        {item.highlight && (
          <Text style={[styles.highlight, { color: item.iconColor }]}>
            {item.highlight}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

// Pagination dots
function Pagination({ 
  data, 
  scrollX 
}: { 
  data: SlideData[]; 
  scrollX: Animated.SharedValue<number>;
}) {
  return (
    <View style={styles.pagination}>
      {data.map((_, index) => {
        const animatedStyle = useAnimatedStyle(() => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];
          
          const dotWidth = interpolate(
            scrollX.value,
            inputRange,
            [8, 24, 8],
            Extrapolation.CLAMP
          );
          
          const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.4, 1, 0.4],
            Extrapolation.CLAMP
          );

          return {
            width: dotWidth,
            opacity,
          };
        });

        return (
          <Animated.View
            key={index}
            style={[styles.dot, animatedStyle]}
          />
        );
      })}
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Go to permissions
      router.push('/onboarding/permissions');
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding/permissions');
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item, index }) => (
          <Slide item={item} index={index} scrollX={scrollX} />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={(event) => {
          scrollX.value = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <Pagination data={SLIDES} scrollX={scrollX} />

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? "Let's Go" : 'Next'}
          </Text>
          <Ionicons 
            name={isLastSlide ? 'checkmark' : 'arrow-forward'} 
            size={20} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  highlight: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B9D',
    marginHorizontal: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
});
