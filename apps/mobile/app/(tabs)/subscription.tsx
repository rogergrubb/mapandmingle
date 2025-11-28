import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/auth';

interface SubscriptionStatus {
  isSubscribed: boolean;
  tier?: 'basic' | 'premium';
  status?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/subscription/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setSubscription({ isSubscribed: false });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier: 'basic' | 'premium') => {
    try {
      setActionLoading(true);
      const response = await api.post(
        '/api/subscription/create-checkout',
        { tier },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const { url } = response.data;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open checkout page');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create checkout');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await api.post(
                '/api/subscription/cancel',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Success', 'Subscription cancelled successfully');
              await loadSubscriptionStatus();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel subscription');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReactivateSubscription = async () => {
    try {
      setActionLoading(true);
      await api.post(
        '/api/subscription/reactivate',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Subscription reactivated successfully');
      await loadSubscriptionStatus();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reactivate subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setActionLoading(true);
      const response = await api.post(
        '/api/subscription/portal',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const { url } = response.data;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open billing portal');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to open billing portal');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscription</Text>
        <Text style={styles.subtitle}>
          {subscription?.isSubscribed
            ? `Current Plan: ${subscription.tier?.toUpperCase()}`
            : 'Choose your plan'}
        </Text>
      </View>

      {subscription?.isSubscribed ? (
        <View style={styles.currentPlanContainer}>
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Subscription Status</Text>
            <Text style={styles.statusValue}>
              {subscription.cancelAtPeriodEnd ? 'Cancelling' : 'Active'}
            </Text>
            {subscription.currentPeriodEnd && (
              <Text style={styles.statusDetail}>
                {subscription.cancelAtPeriodEnd ? 'Access until: ' : 'Renews on: '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.actionsContainer}>
            {subscription.cancelAtPeriodEnd ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleReactivateSubscription}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Reactivate Subscription</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleCancelSubscription}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Cancel Subscription</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleManageBilling}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#007AFF" />
              ) : (
                <Text style={styles.secondaryButtonText}>Manage Billing</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.plansContainer}>
          {/* Basic Plan */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Basic</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>$0.99</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
            </View>

            <View style={styles.trialBadge}>
              <Text style={styles.trialText}>30-Day Free Trial</Text>
            </View>

            <View style={styles.featuresContainer}>
              <Text style={styles.featureItem}>✓ Create and join events</Text>
              <Text style={styles.featureItem}>✓ Send waves to nearby users</Text>
              <Text style={styles.featureItem}>✓ Basic profile customization</Text>
              <Text style={styles.featureItem}>✓ Location sharing</Text>
            </View>

            <TouchableOpacity
              style={[styles.subscribeButton, styles.basicButton]}
              onPress={() => handleSubscribe('basic')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.subscribeButtonText}>Start Free Trial</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Premium Plan */}
          <View style={[styles.planCard, styles.premiumCard]}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>MOST POPULAR</Text>
            </View>

            <View style={styles.planHeader}>
              <Text style={styles.planName}>Premium</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>$4.99</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
            </View>

            <View style={styles.trialBadge}>
              <Text style={styles.trialText}>30-Day Free Trial</Text>
            </View>

            <View style={styles.featuresContainer}>
              <Text style={styles.featureItem}>✓ Everything in Basic</Text>
              <Text style={styles.featureItem}>✓ Unlimited event creation</Text>
              <Text style={styles.featureItem}>✓ Advanced profile features</Text>
              <Text style={styles.featureItem}>✓ Priority support</Text>
              <Text style={styles.featureItem}>✓ Ad-free experience</Text>
              <Text style={styles.featureItem}>✓ Exclusive badges</Text>
            </View>

            <TouchableOpacity
              style={[styles.subscribeButton, styles.premiumButton]}
              onPress={() => handleSubscribe('premium')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.subscribeButtonText}>Start Free Trial</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            Your subscription will automatically renew after the 30-day free trial.
            Cancel anytime before the trial ends to avoid charges.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  currentPlanContainer: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  statusDetail: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  plansContainer: {
    padding: 20,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  trialBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  trialText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 24,
  },
  subscribeButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  basicButton: {
    backgroundColor: '#007AFF',
  },
  premiumButton: {
    backgroundColor: '#FFD700',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
