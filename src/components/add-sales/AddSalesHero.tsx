import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors } from "@/components/ui/theme";

interface HeroConfig {
  label: string;
  sub: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
}

export function AddSalesHero({ config }: { config: HeroConfig }) {
  return (
    <View style={s.wrap}>
      <View
        style={[
          s.accent,
          {
            backgroundColor: config.color,
          },
        ]}
      />

      <View style={s.content}>
        <View
          style={[
            s.iconWrap,
            {
              backgroundColor: config.color + "12",
            },
          ]}
        >
          <Feather name={config.icon} size={21} color={config.color} />
        </View>

        <View style={s.text}>
          <Text style={s.label}>{config.label}</Text>
          <Text style={s.sub}>{config.sub}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },

  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    paddingLeft: 20,
  },

  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    flex: 1,
    gap: 3,
  },

  label: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.gray[900],
    lineHeight: 22,
  },

  sub: {
    fontSize: 12,
    color: colors.gray[500],
    lineHeight: 17,
  },
});
