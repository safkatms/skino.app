import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors } from "@/components/ui/theme";

export interface SummaryMetric {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  value: string;
  color: string;
  hero?: boolean;
}

interface SummaryCardProps {
  dateLabel: string;
  subLabel: string;
  settled: boolean;
  settledLabel?: string;
  metrics: SummaryMetric[];
  onPress?: () => void;
}

export function SummaryCard({
  dateLabel,
  subLabel,
  settled,
  settledLabel = "Settled",
  metrics,
  onPress,
}: SummaryCardProps) {
  const accentColor = settled ? colors.green[500] : colors.red[500];
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { activeOpacity: 0.85, onPress } : {};

  return (
    <Wrapper
      style={[s.card, { borderLeftColor: accentColor }]}
      {...(wrapperProps as any)}
    >
      {/* Header */}
      <View style={s.cardHeader}>
        <View style={s.cardHeaderLeft}>
          <View style={[s.calIconBg, settled ? s.calIconBgGreen : s.calIconBgRed]}>
            <Feather
              name="calendar"
              size={18}
              color={settled ? colors.green[600] : colors.red[500]}
            />
          </View>
          <View>
            <Text style={s.dateLabel}>{dateLabel}</Text>
            <Text style={s.subLabel}>{subLabel}</Text>
          </View>
        </View>
        <View style={s.cardHeaderRight}>
          <View style={[s.badge, settled ? s.badgeGreen : s.badgeRed]}>
            <Feather
              name={settled ? "check-circle" : "alert-circle"}
              size={11}
              color={settled ? colors.green[600] : colors.red[500]}
              style={{ marginRight: 3 }}
            />
            <Text style={[s.badgeText, settled ? s.badgeTextGreen : s.badgeTextRed]}>
              {settled ? settledLabel : "Due"}
            </Text>
          </View>
          {onPress && (
            <Feather name="chevron-right" size={16} color={colors.gray[400]} />
          )}
        </View>
      </View>

      {/* Metric rows */}
      <View style={s.metricList}>
        {metrics.map((r, i) => (
          <View
            key={r.label}
            style={[
              s.metricRow,
              i < metrics.length - 1 && s.metricRowBorder,
              r.hero && s.metricRowHero,
            ]}
          >
            <View style={s.metricLabelRow}>
              <Feather name={r.icon} size={r.hero ? 14 : 12} color={r.color} />
              <Text style={[s.metricLabel, r.hero && s.metricLabelHero]}>
                {r.label}
              </Text>
            </View>
            <Text style={[s.metricValue, { color: r.color }, r.hero && s.metricValueHero]}>
              {r.value}
            </Text>
          </View>
        ))}
      </View>
    </Wrapper>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.gray[300],
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  calIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  calIconBgGreen: { backgroundColor: "#ECFDF5" },
  calIconBgRed: { backgroundColor: "#FEF2F2" },
  dateLabel: { fontSize: 13, fontWeight: "700", color: colors.gray[900] },
  subLabel: { fontSize: 10, color: colors.gray[400], marginTop: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeGreen: { backgroundColor: "#ECFDF5", borderColor: colors.green[200], borderWidth: 1 },
  badgeRed: { backgroundColor: "#FEF2F2", borderColor: colors.red[200], borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  badgeTextGreen: { color: colors.green[600] },
  badgeTextRed: { color: colors.red[500] },
  metricList: { paddingHorizontal: 14, paddingVertical: 4 },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  metricRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  metricRowHero: { paddingVertical: 10 },
  metricLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metricLabel: { fontSize: 13, color: colors.gray[500], fontWeight: "500" },
  metricLabelHero: { fontSize: 14, fontWeight: "600", color: colors.gray[700] },
  metricValue: { fontSize: 13, fontWeight: "700" },
  metricValueHero: { fontSize: 16, fontWeight: "800" },
});
