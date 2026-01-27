import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';



export default function SplashScreen() {
  const router = useRouter();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/(tabs)/dump' as any);
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [router, fadeAnim, scaleAnim, slideAnim, rotateAnim, pulseAnim, glowAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.primary + '20', Colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: pulseAnim },
                { rotate: spin },
              ],
            },
          ]}
        >
          <View style={styles.circle}>
            <LinearGradient
              colors={[Colors.primary, Colors.primary + 'CC', Colors.primary + '99']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.glowContainer,
            {
              opacity: glowAnim,
            },
          ]}
        >
          <View style={[styles.glow, { backgroundColor: Colors.primary + '30' }]} />
          <View style={[styles.glow, styles.glow2, { backgroundColor: Colors.primary + '20' }]} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.title} accessibilityRole="header" testID="brandTitle">
            <Text style={styles.titleMuted}>task</Text>
            <Text style={styles.titleAccent}>melt</Text>
          </Text>
          <Text style={styles.tagline} testID="brandTagline">Chaos in. Clarity out.</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.dotsContainer,
            {
              opacity: glowAnim,
            },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: Colors.primary, opacity: 0.7 }]} />
          <View style={[styles.dot, { backgroundColor: Colors.primary, opacity: 0.4 }]} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 40,
    position: 'relative',
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -40,
  },
  glow2: {
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -90,
  },
  title: {
    fontSize: 50,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -1.4,
    marginBottom: 10,
    textAlign: 'center',
  },
  titleMuted: {
    color: Colors.textSecondary,
  },
  titleAccent: {
    color: Colors.primary,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    textAlign: 'center',
    textTransform: 'uppercase' as const,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 50,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
