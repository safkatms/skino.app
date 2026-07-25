import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";
import {
  LayoutDashboard,
  PlusCircle,
  BarChart2,
  Calendar,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../ui/theme";

const nav = [
  { href: "/(app)/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/(app)/sales/add", label: "Add Sales", icon: PlusCircle },
  { href: "/(app)/sales/weekly", label: "Weekly", icon: BarChart2 },
  { href: "/(app)/sales/monthly", label: "Monthly", icon: Calendar },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {nav.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href.replace("/(app)", "") ||
          pathname.startsWith(href.replace("/(app)", "") + "/");
        return (
          <TouchableOpacity
            key={href}
            style={styles.tab}
            onPress={() => router.push(href as any)}
            activeOpacity={0.7}
          >
            <Icon
              size={22}
              color={active ? colors.indigo[600] : colors.gray[400]}
              strokeWidth={active ? 2.2 : 1.8}
            />
            <Text
              style={[
                styles.label,
                active ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingTop: 8,
    gap: 3,
  },
  label: { fontSize: 10, fontWeight: "500" },
  labelActive: { color: colors.indigo[600] },
  labelInactive: { color: colors.gray[400] },
});
