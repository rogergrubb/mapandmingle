import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  Dimensions,
  FlatList,
  StatusBar,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface ImageViewerProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  onShare?: (imageUri: string) => void;
  onSave?: (imageUri: string) => void;
}

export default function ImageViewer({
  visible,
  images,
  initialIndex = 0,
  onClose,
  onShare,
  onSave,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 20 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        translateY.setValue(gestureState.dy);
        const opacity = Math.max(0, 1 - Math.abs(gestureState.dy) / 300);
        fadeAnim.setValue(opacity);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dy) > 100 || Math.abs(gestureState.vy) > 0.5) {
          handleClose();
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Show animation when opening
  const handleShow = () => {
    setCurrentIndex(initialIndex);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      translateY.setValue(0);
      onClose();
    });
  };

  const toggleControls = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowControls((prev) => !prev);
    Animated.timing(controlsOpacity, {
      toValue: showControls ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShare?.(images[currentIndex]);
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave?.(images[currentIndex]);
  };

  const renderImage = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      activeOpacity={1}
      onPress={toggleControls}
      style={{ width, height }}
    >
      <Image
        source={{ uri: item }}
        style={{ width, height }}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onShow={handleShow}
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'black',
          opacity: fadeAnim,
        }}
      >
        {/* Images */}
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            flex: 1,
            transform: [
              { scale: scaleAnim },
              { translateY: translateY },
            ],
          }}
        >
          <FlatList
            data={images}
            renderItem={renderImage}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />
        </Animated.View>

        {/* Top Controls */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            opacity: controlsOpacity,
          }}
          className="pt-14 pb-4 px-4 bg-gradient-to-b from-black/70 to-transparent"
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={handleClose}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            {/* Image Counter */}
            {images.length > 1 && (
              <View className="bg-white/10 px-3 py-1 rounded-full">
                <Text className="text-white font-medium">
                  {currentIndex + 1} / {images.length}
                </Text>
              </View>
            )}

            <View className="w-10" />
          </View>
        </Animated.View>

        {/* Bottom Controls */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            opacity: controlsOpacity,
          }}
          className="pt-4 pb-10 px-4 bg-gradient-to-t from-black/70 to-transparent"
        >
          <View className="flex-row items-center justify-center space-x-6">
            {onShare && (
              <TouchableOpacity
                onPress={handleShare}
                className="w-12 h-12 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="share-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
            
            {onSave && (
              <TouchableOpacity
                onPress={handleSave}
                className="w-12 h-12 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="download-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {/* Page Indicators */}
          {images.length > 1 && (
            <View className="flex-row justify-center mt-4 space-x-2">
              {images.map((_, index) => (
                <View
                  key={index}
                  className={`h-1.5 rounded-full ${
                    index === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
