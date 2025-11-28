import { TouchableOpacity, TouchableOpacityProps, Text, View, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { forwardRef } from 'react';

interface HapticButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

const variants = {
  primary: 'bg-primary-500 active:bg-primary-600',
  secondary: 'bg-gray-100 active:bg-gray-200',
  outline: 'border-2 border-primary-500 bg-transparent active:bg-primary-50',
  ghost: 'bg-transparent active:bg-gray-100',
  danger: 'bg-red-500 active:bg-red-600',
};

const textVariants = {
  primary: 'text-white',
  secondary: 'text-gray-900',
  outline: 'text-primary-500',
  ghost: 'text-gray-900',
  danger: 'text-white',
};

const sizes = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-6 py-4',
};

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const HapticButton = forwardRef<View, HapticButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      hapticStyle = Haptics.ImpactFeedbackStyle.Light,
      onPress,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const handlePress = (event: any) => {
      if (!disabled && !isLoading) {
        Haptics.impactAsync(hapticStyle);
        onPress?.(event);
      }
    };

    const isDisabled = disabled || isLoading;

    return (
      <TouchableOpacity
        ref={ref}
        onPress={handlePress}
        disabled={isDisabled}
        className={`
          ${variants[variant]}
          ${sizes[size]}
          rounded-xl
          flex-row
          items-center
          justify-center
          ${isDisabled ? 'opacity-50' : ''}
          ${className}
        `}
        activeOpacity={0.8}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator
            color={variant === 'primary' || variant === 'danger' ? 'white' : '#FF6B9D'}
            size="small"
          />
        ) : (
          <>
            {leftIcon && <View className="mr-2">{leftIcon}</View>}
            {typeof children === 'string' ? (
              <Text
                className={`
                  ${textVariants[variant]}
                  ${textSizes[size]}
                  font-semibold
                `}
              >
                {children}
              </Text>
            ) : (
              children
            )}
            {rightIcon && <View className="ml-2">{rightIcon}</View>}
          </>
        )}
      </TouchableOpacity>
    );
  }
);

HapticButton.displayName = 'HapticButton';

// Icon Button variant
interface HapticIconButtonProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

const iconSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

export const HapticIconButton = forwardRef<View, HapticIconButtonProps>(
  (
    {
      icon,
      variant = 'ghost',
      size = 'md',
      hapticStyle = Haptics.ImpactFeedbackStyle.Light,
      onPress,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const handlePress = (event: any) => {
      if (!disabled) {
        Haptics.impactAsync(hapticStyle);
        onPress?.(event);
      }
    };

    return (
      <TouchableOpacity
        ref={ref}
        onPress={handlePress}
        disabled={disabled}
        className={`
          ${variants[variant]}
          ${iconSizes[size]}
          rounded-full
          items-center
          justify-center
          ${disabled ? 'opacity-50' : ''}
          ${className}
        `}
        activeOpacity={0.7}
        {...props}
      >
        {icon}
      </TouchableOpacity>
    );
  }
);

HapticIconButton.displayName = 'HapticIconButton';

// FAB (Floating Action Button)
interface HapticFABProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

export const HapticFAB = forwardRef<View, HapticFABProps>(
  (
    {
      icon,
      hapticStyle = Haptics.ImpactFeedbackStyle.Medium,
      onPress,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const handlePress = (event: any) => {
      if (!disabled) {
        Haptics.impactAsync(hapticStyle);
        onPress?.(event);
      }
    };

    return (
      <TouchableOpacity
        ref={ref}
        onPress={handlePress}
        disabled={disabled}
        className={`
          bg-primary-500
          w-14
          h-14
          rounded-full
          items-center
          justify-center
          shadow-lg
          ${disabled ? 'opacity-50' : ''}
          ${className}
        `}
        style={{
          shadowColor: '#FF6B9D',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        activeOpacity={0.8}
        {...props}
      >
        {icon}
      </TouchableOpacity>
    );
  }
);

HapticFAB.displayName = 'HapticFAB';
