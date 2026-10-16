import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { LineChart } from "react-native-gifted-charts";
import { colors } from "../ui/theme";
import { font, spacing } from "@/components/ui/typography";

const fmt = (v = 0) => `৳${v.toLocaleString("en-US")}`;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseWeekDesc(weekKey: string): string {
  const [s, e] = weekKey.split("_");
  if (!s || !e) return weekKey;
  const sd = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
  const ed = new Date(+e.slice(0, 4), +e.slice(4, 6) - 1, +e.slice(6, 8));
  const sm = MONTHS[sd.getMonth()], em = MONTHS[ed.getMonth()];
  const sy = sd.getFullYear(), ey = ed.getFullYear();
  if (sy === ey && sm === em) return `${sm} ${sd.getDate()} – ${ed.getDate()}, ${sy}`;
  if (sy === ey) return `${sm} ${sd.getDate()} – ${em} ${ed.getDate()}, ${sy}`;
  return `${sm} ${sd.getDate()}, ${sy} – ${em} ${ed.getDate()}, ${ey}`;
}

export interface WeeklySummary {
  weekKey: string;
  label: string;
  sales: number;
  profit: number;
  marketing: number;
  netProfit: number;
  returned: number;
  payments: number;
  actualProfit: number;
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
  const { width } = useWindowDimensions();

  const currentWeek = weeks[weeks.length - 1];

  const highestWeek = useMemo(
    () => weeks.reduce((a, b) => (b.sales > a.sales ? b : a), weeks[0]),
    [weeks],
  );

  const shortLabel = (weekKey: string) => {
    const [s] = weekKey.split("_");
    const d = new Date(+s.slice(0,4), +s.slice(4,6)-1, +s.slice(6,8));
    return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  };

  const { salesData, profitData, netData } = useMemo(() => ({
    salesData:  weeks.map((w) => ({ value: w.sales,     label: shortLabel(w.weekKey), onPress: () => setSelected(p => p?.weekKey === w.weekKey ? null : w) })),
    profitData: weeks.map((w) => ({ value: w.profit,    onPress: () => setSelected(p => p?.weekKey === w.weekKey ? null : w) })),
    netData:    weeks.map((w) => ({ value: w.netProfit, onPress: () => setSelected(p => p?.weekKey === w.weekKey ? null : w) })),
  }), [weeks]);

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
            <Text style={s.currentWeek}>
              {parseWeekDesc(currentWeek?.weekKey ?? "")}
            </Text>
            <Text style={s.currentLabel}>CURRENT WEEK</Text>
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
        <LineChart
          areaChart
          data={salesData}
          data2={profitData}
          data3={netData}
          height={160}
          width={width - 80}
          noOfSections={4}
          curved
          isAnimated
          animationDuration={600}
          scrollToEnd
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor="#F3F4F6"
          rulesColor="#F3F4F6"
          rulesType="solid"
          yAxisTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
          xAxisLabelTextStyle={{ color: "#9CA3AF", fontSize: 9, marginTop: 4 }}

          color1={colors.gray[900]}
          color2={colors.indigo[500]}
          color3={colors.green[500]}
          startFillColor1={colors.gray[900]}
          startFillColor2={colors.indigo[500]}
          startFillColor3={colors.green[500]}
          endFillColor1="#F9FAFB"
          endFillColor2="#EEF2FF"
          endFillColor3="#ECFDF5"
          startOpacity1={0.18}
          startOpacity2={0.22}
          startOpacity3={0.22}
          endOpacity1={0}
          endOpacity2={0}
          endOpacity3={0}
          dataPointsColor1={colors.gray[900]}
          dataPointsColor2={colors.indigo[500]}
          dataPointsColor3={colors.green[500]}
          dataPointsRadius={3}
          hideDataPoints={weeks.length > 8}
        />
      </View>

      {selected && (
        <View style={s.details}>
          <View style={s.detailsHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.detailsTitle}>
                {parseWeekDesc(selected.weekKey)}
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
    marginTop: 14,
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing.md,
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
