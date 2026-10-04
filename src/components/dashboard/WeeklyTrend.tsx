import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors } from "../ui/theme";
import { font, spacing } from "@/components/ui/typography";

const fmt = (v = 0) => `৳${v.toLocaleString("en-US")}`;

export interface WeeklySummary {
  weekKey: string;
  label: string;
  sales: number;
  profit: number;
  marketing: number;
  netProfit: number;
  returned: number;
  payments: number;
  due: number;
}

interface WeeklyTrendProps {
  weeks: WeeklySummary[];
}

const METRICS = [
  { key: "sales" as const, label: "Sales", color: colors.gray[900] },
  { key: "profit" as const, label: "Profit", color: colors.indigo[600] },
  { key: "netProfit" as const, label: "Net Profit", color: colors.green[600] },
];

export function WeeklyTrend({ weeks }: WeeklyTrendProps) {
  const [selected, setSelected] = useState<WeeklySummary | null>(null);

  const currentWeek = weeks[weeks.length - 1];

  const highestWeek = useMemo(
    () => weeks.reduce((a, b) => (b.sales > a.sales ? b : a), weeks[0]),
    [weeks],
  );

  const maxValue = useMemo(
    () =>
      Math.max(...weeks.flatMap((w) => [w.sales, w.profit, w.netProfit]), 1),
    [weeks],
  );

  if (!weeks.length) {
    return (
      <View style={s.empty}>
        <Feather name="bar-chart-2" size={24} color="#9CA3AF" />
        <Text style={s.emptyTitle}>No trend data</Text>
        <Text style={s.emptyText}>
          Weekly performance data will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Performance Trend</Text>
          <Text style={s.subtitle}>Your weekly business performance</Text>
        </View>
      </View>

      <View style={s.legend}>
        {METRICS.map((metric) => (
          <View key={metric.key} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: metric.color }]} />
            <Text style={s.legendText}>{metric.label}</Text>
          </View>
        ))}
        <View style={s.legendItem}>
          <View
            style={[
              s.legendDot,
              {
                backgroundColor: "#FEF3C7",
                borderWidth: 1,
                borderColor: "#D97706",
              },
            ]}
          />
          <Text style={s.legendText}>All-time high</Text>
        </View>
      </View>

      <View style={s.currentCard}>
        <View style={s.currentCardTop}>
          <View>
            <Text style={s.currentLabel}>CURRENT WEEK</Text>
            <Text style={s.currentWeek}>
              {currentWeek?.label?.replace(/_/g, " ")}
            </Text>
          </View>
          {currentWeek?.weekKey === highestWeek?.weekKey && (
            <View style={s.badgeHighest}>
              <Text style={s.badgeHighestText}>↑ All-time high</Text>
            </View>
          )}
        </View>

        <View style={s.currentMetrics}>
          <View style={s.currentMetric}>
            <Text style={s.currentMetricLabel}>Sales</Text>
            <Text style={[s.currentMetricValue, { color: colors.gray[900] }]}>
              {fmt(currentWeek.sales)}
            </Text>
          </View>
          <View style={s.currentDivider} />
          <View style={s.currentMetric}>
            <Text style={s.currentMetricLabel}>Profit</Text>
            <Text style={[s.currentMetricValue, { color: colors.indigo[600] }]}>
              {fmt(currentWeek.profit)}
            </Text>
          </View>
          <View style={s.currentDivider} />
          <View style={s.currentMetric}>
            <Text style={s.currentMetricLabel}>Net</Text>
            <Text style={[s.currentMetricValue, { color: colors.green[600] }]}>
              {fmt(currentWeek.netProfit)}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.chartContainer}>
        <View style={s.gridLines}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={s.gridLine} />
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chartScroll}
        >
          <View style={[s.chart, { width: Math.max(weeks.length * 78, 300) }]}>
            {weeks.map((week) => {
              const isCurrent = currentWeek.weekKey === week.weekKey;
              const isHighest = highestWeek?.weekKey === week.weekKey;
              const isSelected = selected?.weekKey === week.weekKey;

              return (
                <TouchableOpacity
                  key={week.weekKey}
                  style={[s.weekColumn, isSelected && s.selectedColumn]}
                  activeOpacity={0.8}
                  onPress={() =>
                    setSelected((prev) =>
                      prev?.weekKey === week.weekKey ? null : week,
                    )
                  }
                >
                  <View style={s.topBadgeRow}>
                    {isHighest && (
                      <View style={s.badgeHighest}>
                        <Text style={s.badgeHighestText}>↑ Best</Text>
                      </View>
                    )}
                    {isCurrent && !isHighest && (
                      <View style={s.badgeCurrent}>
                        <Text style={s.badgeCurrentText}>Now</Text>
                      </View>
                    )}
                  </View>

                  <View style={s.bars}>
                    {METRICS.map((metric) => {
                      const value = week[metric.key];
                      const height = Math.max((value / maxValue) * 135, 4);
                      return (
                        <View key={metric.key} style={s.barWrapper}>
                          <View
                            style={[
                              s.bar,
                              { height, backgroundColor: metric.color },
                              !isCurrent && !isHighest && { opacity: 0.35 },
                            ]}
                          />
                        </View>
                      );
                    })}
                  </View>

                  <View style={s.weekLabel}>
                    <Text
                      style={[s.monthText, isCurrent && s.currentLabelText]}
                    >
                      {week.label
                        .split("_")[0]
                        ?.replace(/^\d{4}/, "")
                        .slice(0, 3)}
                    </Text>
                    <Text style={[s.weekText, isCurrent && s.currentLabelText]}>
                      {week.label.split("_")[1]?.replace("Week-", "W")}
                    </Text>
                  </View>

                  <View style={s.bottomIndicatorRow}>
                    {isCurrent && <View style={s.dotCurrent} />}
                    {isHighest && !isCurrent && <View style={s.dotHighest} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {selected && (
        <View style={s.details}>
          <View style={s.detailsHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.detailsTitle}>
                {selected.label.replace(/_/g, " ")}
              </Text>
              <View style={s.detailsBadgeRow}>
                <Text style={s.detailsSubtitle}>Weekly performance</Text>
                {selected.weekKey === highestWeek?.weekKey && (
                  <View style={s.badgeHighest}>
                    <Text style={s.badgeHighestText}>↑ All-time high</Text>
                  </View>
                )}
                {selected.weekKey === currentWeek?.weekKey && (
                  <View style={s.badgeCurrent}>
                    <Text style={s.badgeCurrentText}>Current</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setSelected(null)}
              style={s.closeButton}
            >
              <Feather name="x" size={15} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={s.detailsGrid}>
            {[
              {
                label: "Sales",
                value: selected.sales,
                color: colors.gray[900],
                bg: "#F3F4F6",
              },
              {
                label: "Profit",
                value: selected.profit,
                color: colors.indigo[600],
                bg: "#EEF2FF",
              },
              {
                label: "Net Profit",
                value: selected.netProfit,
                color: colors.green[600],
                bg: "#ECFDF5",
              },
              {
                label: "Returned",
                value: selected.returned,
                color: colors.orange[500],
                bg: "#FFF7ED",
              },
              {
                label: "Marketing",
                value: selected.marketing,
                color: "#A855F7",
                bg: "#FDF4FF",
              },
              {
                label: "Collected",
                value: selected.payments,
                color: colors.green[600],
                bg: "#ECFDF5",
              },
            ].map((item) => (
              <View key={item.label} style={s.detailItem}>
                <View style={[s.detailIcon, { backgroundColor: item.bg }]}>
                  <View
                    style={[s.detailDot, { backgroundColor: item.color }]}
                  />
                </View>
                <View style={s.detailText}>
                  <Text style={s.detailLabel}>{item.label}</Text>
                  <Text style={[s.detailValue, { color: item.color }]}>
                    {fmt(item.value)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {selected.due > 0 && (
            <View style={s.dueRow}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={s.dueLabel}>Outstanding Due</Text>
              <Text style={s.dueValue}>{fmt(selected.due)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEF0F5",
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.xl,
    overflow: "hidden",
  },
  empty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEF0F5",
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: font.xl,
    fontWeight: font.bold,
    color: "#374151",
    marginTop: 10,
  },
  emptyText: {
    fontSize: font.base,
    color: "#9CA3AF",
    marginTop: spacing.sm,
  },

  header: {
    paddingHorizontal: spacing["2xl"],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: font["2xl"],
    fontWeight: font.extrabold,
    color: "#111827",
  },
  subtitle: { fontSize: font.base, color: "#9CA3AF", marginTop: spacing.xs },

  legend: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginTop: 14,
    paddingHorizontal: spacing["2xl"],
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 2 },
  legendText: {
    fontSize: font.xs,
    fontWeight: font.semibold,
    color: "#6B7280",
  },

  currentCard: {
    marginHorizontal: spacing["2xl"],
    marginTop: 14,
    padding: spacing.lg,
    borderRadius: 14,
    // backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#EEF0F5",
  },
  currentCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  currentLabel: {
    fontSize: font.xs,
    fontWeight: font.extrabold,
    color: "#9CA3AF",
    letterSpacing: 0.6,
  },
  currentWeek: {
    fontSize: font.base,
    fontWeight: font.bold,
    color: "#374151",
    marginTop: spacing.xs,
  },
  currentMetrics: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  currentMetric: { flex: 1 },
  currentMetricLabel: { fontSize: font.xs, color: "#9CA3AF" },
  currentMetricValue: {
    fontSize: font.lg,
    fontWeight: font.extrabold,
    marginTop: spacing.xs,
  },
  currentDivider: {
    width: 1,
    height: 25,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 10,
  },

  chartContainer: {
    height: 230,
    marginTop: 14,
    position: "relative",
  },
  gridLines: {
    position: "absolute",
    left: spacing["2xl"],
    right: spacing["2xl"],
    top: spacing["2xl"],
    height: 145,
    justifyContent: "space-between",
  },
  gridLine: { borderTopWidth: 1, borderTopColor: "#F1F2F6" },
  chartScroll: { paddingHorizontal: spacing["2xl"] },
  chart: {
    height: 220,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
  },
  weekColumn: {
    width: 70,
    height: 220,
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: 10,
    paddingBottom: spacing.xs,
  },
  selectedColumn: { backgroundColor: "#F9FAFB" },
  topBadgeRow: {
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  bars: {
    height: 145,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 3,
  },
  barWrapper: {
    width: 15,
    height: 145,
    justifyContent: "flex-end",
  },
  bar: {
    width: 15,
    minHeight: 4,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  weekLabel: { alignItems: "center", marginTop: spacing.md - 2 },
  monthText: { fontSize: font.xs, fontWeight: font.semibold, color: "#9CA3AF" },
  weekText: {
    fontSize: font.xs,
    fontWeight: font.semibold,
    color: "#D1D5DB",
    marginTop: 1,
  },
  currentLabelText: { color: colors.indigo[600], fontWeight: font.extrabold },
  bottomIndicatorRow: {
    height: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
  dotCurrent: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.indigo[500],
  },
  dotHighest: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D97706",
  },

  badgeHighest: {
    backgroundColor: "#FEF3C7",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  badgeHighestText: {
    fontSize: 8,
    fontWeight: font.extrabold,
    color: "#D97706",
  },
  badgeCurrent: {
    backgroundColor: "#EEF2FF",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  badgeCurrentText: {
    fontSize: font.xs,
    fontWeight: font.bold,
    color: colors.indigo[600],
  },

  details: {
    marginHorizontal: spacing["2xl"],
    marginTop: 10,
    padding: 13,
    borderRadius: 15,
    // backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#EEF0F5",
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  detailsTitle: {
    fontSize: font.md,
    fontWeight: font.extrabold,
    color: "#374151",
  },
  detailsBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
    flexWrap: "wrap",
  },
  detailsSubtitle: { fontSize: font.xs, color: "#9CA3AF" },
  closeButton: {
    width: 27,
    height: 27,
    borderRadius: spacing.md,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEF0F5",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  detailItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  detailIcon: {
    width: 26,
    height: 26,
    borderRadius: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },
  detailDot: { width: 7, height: 7, borderRadius: 3 },
  detailText: { flex: 1 },
  detailLabel: { fontSize: font.xs, color: "#9CA3AF" },
  detailValue: {
    fontSize: font.base,
    fontWeight: font.extrabold,
    marginTop: 1,
  },
  dueRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF0F5",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  dueLabel: {
    flex: 1,
    fontSize: font.xs,
    fontWeight: font.semibold,
    color: "#EF4444",
  },
  dueValue: { fontSize: font.md, fontWeight: font.black, color: "#EF4444" },
});
