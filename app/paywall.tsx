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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check, Sparkles, Crown, Zap, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PurchasesPackage } from 'react-native-purchases';
import Colors from '@/constants/colors';
import { useRevenueCat } from '@/contexts/RevenueCatContext';

const TERMS_URL = 'https://taskmelt.app/terms';
const PRIVACY_URL = 'https://taskmelt.app/privacy';

type PlanType = 'monthly' | 'yearly' | 'lifetime';

const FEATURES = [
  { icon: Zap, text: 'Unlimited brain dumps' },
  { icon: Sparkles, text: 'Unlimited AI organization' },
  { icon: Crown, text: 'One-time payment, yours forever' },
  { icon: Shield, text: 'Support development' },
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
    lifetimePackage,
    purchasePackage,
    restorePurchases,
    isPurchasing,
    isRestoring,
    isLoading,
    allPackages,
    error,
    isInitialized,
  } = useRevenueCat();

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);



  const getSelectedPackage = useCallback((): PurchasesPackage | undefined => {
    return lifetimePackage;
  }, [lifetimePackage]);

  const handlePurchase = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Purchases are only available on mobile devices.');
      return;
    }

    const pkg = getSelectedPackage();
    if (!pkg) {
      Alert.alert('Error', 'Purchase is not available at this time. Please try again later.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await purchasePackage(pkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Welcome to Pro!',
        'Thank you for your purchase! You now have unlimited AI processing.',
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

  const handleOpenTerms = useCallback(() => {
    Linking.openURL(TERMS_URL);
  }, []);

  const handleOpenPrivacy = useCallback(() => {
    Linking.openURL(PRIVACY_URL);
  }, []);

  const formatPrice = (pkg: PurchasesPackage | undefined, fallback: string): string => {
    if (pkg?.product?.priceString) {
      return pkg.product.priceString;
    }
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
            Get unlimited AI processing with a one-time purchase
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
        ) : error || (isInitialized && allPackages.length === 0) ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to Load Plans</Text>
            <Text style={styles.errorText}>
              {error || 'Subscription plans are temporarily unavailable. Please try again later.'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleClose}
            >
              <Text style={styles.retryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pricingSection}>
            {lifetimePackage ? (
              <View style={styles.singlePriceCard}>
                <Text style={styles.singlePriceAmount}>
                  {formatPrice(lifetimePackage, '$6.99')}
                </Text>
                <Text style={styles.singlePriceLabel}>One-time purchase</Text>
                <Text style={styles.singlePriceSubtext}>
                  Pay once, unlimited AI processing forever
                </Text>
              </View>
            ) : (
              <View style={styles.singlePriceCard}>
                <Text style={styles.singlePriceAmount}>$6.99</Text>
                <Text style={styles.singlePriceLabel}>One-time purchase</Text>
                <Text style={styles.singlePriceSubtext}>
                  Pay once, unlimited AI processing forever
                </Text>
              </View>
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
              Get Pro for {formatPrice(lifetimePackage, '$6.99')}
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
          One-time purchase. No subscriptions, no recurring charges. Payment will be charged to your Apple ID account.
        </Text>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={handleOpenTerms}>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>•</Text>
          <TouchableOpacity onPress={handleOpenPrivacy}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
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
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pricingSection: {
    alignItems: 'center',
  },
  singlePriceCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 32,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
  },
  singlePriceAmount: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  singlePriceLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  singlePriceSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  legalLink: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500' as const,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
