import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors } from "@/components/ui/theme";
import { spacing } from "@/components/ui/typography";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DashboardHeaderProps {
  onLogoutPress?: () => void;
}

export function DashboardHeader({ onLogoutPress }: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top, height: 64 + insets.top },
      ]}
    >
      <Image
        source={require("../../../assets/skinfo-170x80.webp")}
        style={styles.logo}
        resizeMode="contain"
      />
      <TouchableOpacity
        style={styles.logoutButton}
        activeOpacity={0.75}
        onPress={onLogoutPress}
      >
        <Feather name="log-out" size={17} color={colors.gray[500]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: spacing["2xl"],
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  logo: {
    width: 112,
    height: 36,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#F8F9FC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEF0F5",
  },
});
