import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check, Sparkles, Crown, Zap, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PurchasesPackage } from 'react-native-purchases';
import Colors from '@/constants/colors';
import { useRevenueCat } from '@/contexts/RevenueCatContext';

type PlanType = 'monthly' | 'yearly' | 'lifetime';

const FEATURES = [
  { icon: Zap, text: 'Unlimited brain dumps' },
  { icon: Sparkles, text: 'Advanced AI organization' },
  { icon: Shield, text: 'Priority support' },
  { icon: Crown, text: 'Early access to features' },
];

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  savings?: string;
  isSelected: boolean;
  isBestValue?: boolean;
  onSelect: () => void;
}

function PricingCard({
  title,
  price,
  period,
  savings,
  isSelected,
  isBestValue,
  onSelect,
}: PricingCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.pricingCard,
        isSelected && styles.pricingCardSelected,
        isBestValue && styles.pricingCardBestValue,
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {isBestValue && (
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueText}>Best Value</Text>
        </View>
      )}
      <View style={styles.pricingCardContent}>
        <View style={styles.radioOuter}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
        <View style={styles.pricingInfo}>
          <Text style={[styles.planTitle, isSelected && styles.planTitleSelected]}>
            {title}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.price, isSelected && styles.priceSelected]}>
              {price}
            </Text>
            <Text style={[styles.period, isSelected && styles.periodSelected]}>
              {period}
            </Text>
          </View>
          {savings && (
            <Text style={styles.savings}>{savings}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const {
    monthlyPackage,
    yearlyPackage,
    lifetimePackage,
    purchasePackage,
    restorePurchases,
    isPurchasing,
    isRestoring,
    isLoading,
    allPackages,
  } = useRevenueCat();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleSelectPlan = useCallback((plan: PlanType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(plan);
  }, []);

  const getSelectedPackage = useCallback((): PurchasesPackage | undefined => {
    switch (selectedPlan) {
      case 'monthly':
        return monthlyPackage;
      case 'yearly':
        return yearlyPackage;
      case 'lifetime':
        return lifetimePackage;
      default:
        return yearlyPackage;
    }
  }, [selectedPlan, monthlyPackage, yearlyPackage, lifetimePackage]);

  const handlePurchase = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Purchases are only available on mobile devices.');
      return;
    }

    const pkg = getSelectedPackage();
    if (!pkg) {
      Alert.alert('Error', 'Selected plan is not available. Please try again.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await purchasePackage(pkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Welcome to Pro!',
        'Thank you for upgrading. Enjoy all the premium features in taskmelt!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Purchase failed';
      if (!message.includes('cancelled') && !message.includes('canceled')) {
        Alert.alert('Purchase Failed', message);
      }
    }
  }, [getSelectedPackage, purchasePackage, router]);

  const handleRestore = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Restore is only available on mobile devices.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await restorePurchases();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Purchases Restored', 'Your purchases have been restored successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Restore failed';
      Alert.alert('Restore Failed', message);
    }
  }, [restorePurchases]);

  const formatPrice = (pkg: PurchasesPackage | undefined, fallback: string): string => {
    return fallback;
  };

  const isProcessing = isPurchasing || isRestoring;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Crown size={40} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>task<Text style={styles.heroTitleItalic}>melt</Text> Pro</Text>
          <Text style={styles.heroSubtitle}>
            Unlock the full potential of your productivity
          </Text>
        </View>

        <View style={styles.featuresSection}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <feature.icon size={20} color={Colors.primary} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
              <Check size={18} color={Colors.success} />
            </View>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        ) : (
          <View style={styles.pricingSection}>
            {(yearlyPackage || allPackages.length === 0) && (
              <PricingCard
                title="Yearly"
                price={formatPrice(yearlyPackage, '$69.99')}
                period="/year"
                savings="Save 17%"
                isSelected={selectedPlan === 'yearly'}
                isBestValue
                onSelect={() => handleSelectPlan('yearly')}
              />
            )}

            {(monthlyPackage || allPackages.length === 0) && (
              <PricingCard
                title="Monthly"
                price={formatPrice(monthlyPackage, '$6.99')}
                period="/month"
                isSelected={selectedPlan === 'monthly'}
                onSelect={() => handleSelectPlan('monthly')}
              />
            )}

            {(lifetimePackage || allPackages.length === 0) && (
              <PricingCard
                title="Lifetime"
                price={formatPrice(lifetimePackage, '$99.99')}
                period="one-time"
                savings="Pay once, own forever"
                isSelected={selectedPlan === 'lifetime'}
                onSelect={() => handleSelectPlan('lifetime')}
              />
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.purchaseButton, isProcessing && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.purchaseButtonText}>
              Continue with {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isProcessing}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color={Colors.textSecondary} />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Cancel anytime. Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  heroTitleItalic: {
    fontStyle: 'italic' as const,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pricingSection: {
    gap: 12,
  },
  pricingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  pricingCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  pricingCardBestValue: {
    borderColor: Colors.primary,
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  bestValueText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  pricingCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
  },
  pricingInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  planTitleSelected: {
    color: Colors.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  priceSelected: {
    color: Colors.primary,
  },
  period: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  periodSelected: {
    color: Colors.primaryLight,
  },
  savings: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  purchaseButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
