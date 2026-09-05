import { useUserStore } from "@/store/userStore";
import { OnboardingData } from "@/utils/data";
import { COLORS, fonts, typography } from "@/utils/styles";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.62;

export default function Index() {
  const user = useUserStore((state) => state.user);
  const router = useRouter();

  const [index, setIndex] = useState(0);

  const [imageOpacity] = useState(() => new Animated.Value(1));
  const [contentOpacity] = useState(() => new Animated.Value(1));
  const [contentTranslate] = useState(() => new Animated.Value(0));

  const current = OnboardingData[index];
  const isLast = index === OnboardingData.length - 1;

  useEffect(() => {
    imageOpacity.setValue(0);
    contentOpacity.setValue(0);
    contentTranslate.setValue(15);

    Animated.parallel([
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),

      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        delay: 80,
        useNativeDriver: true,
      }),

      Animated.spring(contentTranslate, {
        toValue: 0,
        damping: 18,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslate, imageOpacity, index]);

  if (user) {
    return <Redirect href="/(main)" />;
  }

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (index < OnboardingData.length - 1) {
      setIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (index > 0) {
      setIndex((prev) => prev - 1);
    }
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    router.replace("/auth");
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.neutral }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* ==============================
          IMAGE SECTION
      ============================== */}

      <View
        style={{
          height: IMAGE_HEIGHT,
          width: SCREEN_WIDTH,
          overflow: "hidden",
          borderBottomLeftRadius: 34,
          borderBottomRightRadius: 34,
        }}
      >
        <Animated.Image
          source={current.image}
          resizeMode="cover"
          style={{
            position: "absolute",
            width: SCREEN_WIDTH,
            height: IMAGE_HEIGHT,
            opacity: imageOpacity,
          }}
        />

        {/* Image overlay */}

        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.16)",
          }}
        />

        {/* Top safe area */}

        <SafeAreaView
          edges={["top"]}
          style={{
            flex: 1,
            paddingHorizontal: 22,
          }}
        >
          {/* Header */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: COLORS.white,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="leaf"
                  size={21}
                  color={COLORS.primary}
                />
              </View>

              <View style={{ marginLeft: 10 }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 15,
                    letterSpacing: 1.4,
                    color: COLORS.white,
                  }}
                >
                  JARDIN
                </Text>

                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 9,
                    letterSpacing: 2.5,
                    color: COLORS.white,
                    marginTop: -1,
                  }}
                >
                  PRO
                </Text>
              </View>
            </View>

            {/* Counter */}

            <View
              style={{
                paddingHorizontal: 12,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.18)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.30)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  color: COLORS.white,
                }}
              >
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(OnboardingData.length).padStart(2, "0")}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ==============================
          CONTENT SECTION
      ============================== */}

      <Animated.View
        style={{
          flex: 1,
          opacity: contentOpacity,
          transform: [
            {
              translateY: contentTranslate,
            },
          ],
        }}
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: 30,
          }}
        >
          {/* Small label */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 13,
            }}
          >
            <View
              style={{
                width: 26,
                height: 3,
                borderRadius: 3,
                backgroundColor: COLORS.secondary,
              }}
            />

            <Text
              style={{
                marginLeft: 9,
                fontFamily: fonts.semibold,
                fontSize: 11,
                letterSpacing: 1.2,
                color: COLORS.secondary,
              }}
            >
              GESTION INTELLIGENTE
            </Text>
          </View>

          {/* Title */}

          <Text
            style={[
              typography.title,
              {
                color: COLORS.text,
                fontSize: 29,
                lineHeight: 35,
                maxWidth: SCREEN_WIDTH * 0.82,
              },
            ]}
          >
            {current.title}
          </Text>

          {/* Description */}

          <Text
            style={[
              typography.body,
              {
                color: COLORS.darkGray,
                fontSize: 15,
                lineHeight: 22,
                marginTop: 11,
                maxWidth: SCREEN_WIDTH * 0.88,
              },
            ]}
          >
            {current.description}
          </Text>

          {/* Bottom actions */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "auto",
              paddingBottom: 24,
            }}
          >
            {/* Pagination */}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              {OnboardingData.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === index ? 25 : 6,
                    height: 6,
                    borderRadius: 10,
                    backgroundColor:
                      i === index ? COLORS.primary : COLORS.lightGray,
                  }}
                />
              ))}
            </View>

            {/* Navigation */}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              {/* Previous */}

              {index > 0 && (
                <Pressable
                  onPress={handlePrevious}
                  style={({ pressed }) => ({
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: COLORS.lightGray,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: COLORS.white,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={20}
                    color={COLORS.text}
                  />
                </Pressable>
              )}

              {/* Next */}

              <Pressable
                onPress={isLast ? handleGetStarted : handleNext}
                style={({ pressed }) => ({
                  width: 58,
                  height: 58,
                  borderRadius: 20,
                  backgroundColor: COLORS.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,

                  shadowColor: COLORS.primary,
                  shadowOffset: {
                    width: 0,
                    height: 5,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 5,
                })}
              >
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={23}
                  color={COLORS.white}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
