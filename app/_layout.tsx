import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DumpProvider } from "@/contexts/DumpContext";
import { RevenueCatProvider } from "@/contexts/RevenueCatContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="paywall" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="auth" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
        <AuthProvider>
          <RevenueCatProvider>
            <DumpProvider>
              <RootLayoutNav />
            </DumpProvider>
          </RevenueCatProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
