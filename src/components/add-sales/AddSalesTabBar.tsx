import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors } from "@/components/ui/theme";

export type Tab = "sale" | "payment" | "return" | "marketing";

export const TAB_CONFIG = [
  {
    id: "sale" as Tab,
    label: "Sale",
    color: colors.indigo[600],
    icon: "shopping-cart" as const,
  },
  {
    id: "payment" as Tab,
    label: "Payment",
    color: colors.green[600],
    icon: "credit-card" as const,
  },
  {
    id: "return" as Tab,
    label: "Return",
    color: colors.orange[500],
    icon: "rotate-ccw" as const,
  },
  {
    id: "marketing" as Tab,
    label: "Marketing",
    color: "#A855F7",
    icon: "radio" as const,
  },
];

interface AddSalesTabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function AddSalesTabBar({ active, onChange }: AddSalesTabBarProps) {
  return (
    <View style={s.wrap}>
      {TAB_CONFIG.map(({ id, label, color, icon }) => {
        const isActive = active === id;

        return (
          <TouchableOpacity
            key={id}
            style={[
              s.tab,
              isActive && {
                borderBottomColor: color,
              },
            ]}
            onPress={() => onChange(id)}
            activeOpacity={0.7}
          >
            <Feather
              name={icon}
              size={15}
              color={isActive ? color : colors.gray[400]}
            />

            <Text
              style={[
                s.label,
                {
                  color: isActive ? color : colors.gray[400],
                },
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

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    overflow: "hidden",
  },

  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
