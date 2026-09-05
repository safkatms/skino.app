import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  ImageBackground,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api } from "@/lib/axios";
import { logout } from "@/lib/auth";
import { useAuthStore } from "@/store/auth.store";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/api-error";
import { colors } from "@/components/ui/theme";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import Feather from "@expo/vector-icons/Feather";
import { WeeklySummary } from "../sales/weekly";

interface Metrics {
  sales: number;
  profit: number;
}
interface LastWeekMetrics extends Metrics {
  payments: number;
  returned: number;
  due: number;
}
interface DashboardData {
  currentWeekKey: string;
  lastWeekKey: string;
  today: Metrics;
  week: Metrics;
  lastWeek: LastWeekMetrics;
  month: Metrics;
  total: Metrics;
}

const fmt = (v = 0) => `৳${v.toLocaleString("en-US")}`;

// Colored rounded-square icon badge
function IconBadge({
  name,
  bg,
  color,
}: {
  name: React.ComponentProps<typeof Feather>["name"];
  bg: string;
  color: string;
}) {
  return (
    <View style={[styles.iconBadge, { backgroundColor: bg }]}>
      <Feather name={name} size={15} color={color} />
    </View>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroLabel}>{label}</Text>
      <Text style={styles.heroValue}>{value}</Text>
    </View>
  );
}

function MetricRow({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  valueStyle,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricLeft}>
        <IconBadge name={icon} bg={iconBg} color={iconColor} />
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text style={[styles.metricValue, valueStyle]}>{value}</Text>
    </View>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function WeeklyChart({ weeks }: { weeks: WeeklySummary[] }) {
  const maxValue = useMemo(
    () => Math.max(...weeks.map((w) => w.sales), 1),
    [weeks],
  );
  const [selected, setSelected] = React.useState<WeeklySummary | null>(null);
  const highestWeek = useMemo(
    () => weeks.reduce((a, b) => (b.sales > a.sales ? b : a), weeks[0]),
    [weeks],
  );
  const currentWeek = weeks[weeks.length - 1];
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Weekly trend</Text>
          <Text style={styles.chartSubtitle}>
            {weeks.length} weeks · sales &amp; profit
          </Text>
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors.indigo[400] },
              ]}
            />
            <Text style={styles.legendText}>Sales</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.green[500] }]}
            />
            <Text style={styles.legendText}>Profit</Text>
          </View>
        </View>
      </View>
      <View style={styles.weekCompareRow}>
        <TouchableOpacity
          style={[styles.weekCompareCard, { borderColor: colors.indigo[100] }]}
          onPress={() =>
            setSelected((s) =>
              s?.weekKey === currentWeek.weekKey ? null : currentWeek,
            )
          }
          activeOpacity={0.8}
        >
          <View style={styles.weekCompareTop}>
            <View
              style={[
                styles.weekCompareDot,
                { backgroundColor: colors.indigo[400] },
              ]}
            />
            <Text style={styles.weekCompareLabel}>Current</Text>
          </View>
          <Text style={styles.weekCompareValue}>{fmt(currentWeek.sales)}</Text>
          <Text style={styles.weekCompareSub}>
            {currentWeek.label.replace(/_/g, " ")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.weekCompareCard, { borderColor: colors.amber[200] }]}
          onPress={() =>
            setSelected((s) =>
              s?.weekKey === highestWeek.weekKey ? null : highestWeek,
            )
          }
          activeOpacity={0.8}
        >
          <View style={styles.weekCompareTop}>
            <View
              style={[
                styles.weekCompareDot,
                { backgroundColor: colors.amber[400] },
              ]}
            />
            <Text style={styles.weekCompareLabel}>All-time high</Text>
          </View>
          <Text style={styles.weekCompareValue}>{fmt(highestWeek.sales)}</Text>
          <Text style={styles.weekCompareSub}>
            {highestWeek.label.replace(/_/g, " ")}
          </Text>
        </TouchableOpacity>
      </View>
      {selected && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipTitle}>
            {selected.label.replace(/_/g, " ")}
          </Text>
          <View style={styles.tooltipRow}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors.indigo[400] },
              ]}
            />
            <Text style={styles.tooltipText}>Sales</Text>
            <Text style={styles.tooltipValue}>{fmt(selected.sales)}</Text>
          </View>
          <View style={styles.tooltipRow}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.green[500] }]}
            />
            <Text style={styles.tooltipText}>Profit</Text>
            <Text style={styles.tooltipValue}>{fmt(selected.profit)}</Text>
          </View>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScroll}
      >
        <View style={{ width: weeks.length * 44 }}>
          <View
            style={{
              height: 160,
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 6,
              paddingHorizontal: 4,
            }}
          >
            {weeks.map((w) => {
              const salesH = Math.max((w.sales / maxValue) * 150, 4);
              const profitH = Math.max((w.profit / maxValue) * 150, 4);
              const isSelected = selected?.weekKey === w.weekKey;
              return (
                <TouchableOpacity
                  key={w.weekKey}
                  activeOpacity={0.8}
                  onPress={() =>
                    setSelected((s) => (s?.weekKey === w.weekKey ? null : w))
                  }
                  style={{
                    width: 28,
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: 160,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      gap: 2,
                    }}
                  >
                    <View
                      style={[
                        styles.bar,
                        {
                          height: salesH,
                          backgroundColor: isSelected
                            ? colors.green[600]
                            : colors.green[400],
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        {
                          height: profitH,
                          backgroundColor: isSelected
                            ? colors.indigo[700]
                            : colors.indigo[500],
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.chartMonthWrap}>
                    <Text style={styles.chartMonth}>
                      {w.label.split("_")[0].slice(0, 3)}
                    </Text>
                    <Text style={styles.chartMonth}>
                      {w.label.split("_")[1]?.replace("Week-", "W")}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setAuthenticated } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardData>>("/sales/dashboard");
      return res.data.data!;
    },
  });

  const { data: weeklyChartData } = useQuery({
    queryKey: ["sales", "summary", "weekly", "chart"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<WeeklySummary[]>>(
        "/sales/summary/weekly",
      );
      return [...(res.data.data ?? [])].reverse();
    },
  });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    router.replace("/(auth)/login");
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../../../assets/skinfo-170x80.webp")}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          hitSlop={8}
        >
          <Feather name="log-out" size={18} color={colors.gray[500]} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <Spinner fullScreen />
      ) : error ? (
        <View style={{ padding: 20 }}>
          <Alert message={getApiErrorMessage(error)} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.indigo[600]]}
            />
          }
        >
          {/* Hero */}
          <ImageBackground
            source={require("../../../assets/dashboard-hero.png")}
            style={styles.hero}
            imageStyle={styles.heroImage}
            resizeMode="cover"
          >
            {/* Week key row */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroWeekRow}>
                <Feather name="calendar" size={13} color="#A5B4FC" />
                <Text style={styles.heroWeekKey}>
                  {data?.currentWeekKey ?? "Current Week"}
                </Text>
              </View>
            </View>

            {/* Week stats */}
            <View style={styles.heroGrid}>
              <HeroStat label="Week Sales" value={fmt(data?.week.sales)} />
              <View style={styles.heroGridDivider} />
              <HeroStat label="Week Profit" value={fmt(data?.week.profit)} />
            </View>

            <View style={styles.heroDivider} />

            {/* Today stats */}
            <View style={styles.heroGrid}>
              <HeroStat label="Today Sales" value={fmt(data?.today.sales)} />
              <View style={styles.heroGridDivider} />
              <HeroStat label="Today Profit" value={fmt(data?.today.profit)} />
            </View>
          </ImageBackground>

          {/* Last Week */}
          <Card title={`Last Week · ${data?.lastWeekKey ?? ""}`}>
            <MetricRow
              icon="bar-chart-2"
              iconBg="#EEF2FF"
              iconColor={colors.indigo[500]}
              label="Gross Sales"
              value={fmt(data?.lastWeek.sales)}
            />
            <MetricRow
              icon="percent"
              iconBg="#EEF2FF"
              iconColor={colors.indigo[500]}
              label="Profit (30%)"
              value={fmt(data?.lastWeek.profit)}
              valueStyle={{ color: colors.indigo[600] }}
            />
            <MetricRow
              icon="download"
              iconBg="#ECFDF5"
              iconColor={colors.green[600]}
              label="Collected"
              value={fmt(data?.lastWeek.payments)}
              valueStyle={{ color: colors.green[600] }}
            />
            <MetricRow
              icon="rotate-ccw"
              iconBg="#FFF7ED"
              iconColor={colors.orange[500]}
              label="Returned"
              value={fmt(data?.lastWeek.returned)}
              valueStyle={{ color: colors.orange[500] }}
            />

            {/* Due pill */}
            {(() => {
              const due = data?.lastWeek.due ?? 0;
              const isDue = due > 0;
              return (
                <View
                  // activeOpacity={isDue ? 0.7 : 1}
                  style={[
                    styles.duePill,
                    isDue ? styles.duePillRed : styles.duePillGreen,
                  ]}
                >
                  <View style={styles.duePillLeft}>
                    <View
                      style={[
                        styles.duePillIcon,
                        { backgroundColor: isDue ? "#FEE2E2" : "#DCFCE7" },
                      ]}
                    >
                      <Feather
                        name={isDue ? "shopping-bag" : "check-circle"}
                        size={14}
                        color={isDue ? colors.red[500] : colors.green[600]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.duePillLabel,
                        isDue
                          ? styles.duePillLabelRed
                          : styles.duePillLabelGreen,
                      ]}
                    >
                      {isDue ? "Outstanding Due" : "Fully Settled"}
                    </Text>
                  </View>
                  <View style={styles.duePillRight}>
                    <Text
                      style={[
                        styles.duePillValue,
                        { color: isDue ? colors.red[600] : colors.green[600] },
                      ]}
                    >
                      {fmt(due)}
                    </Text>
                    {/* {isDue && (
                      <Feather
                        name="chevron-right"
                        size={16}
                        color={colors.red[400]}
                      />
                    )} */}
                  </View>
                </View>
              );
            })()}
          </Card>

          {/* This Month */}
          <Card title="This Month">
            <MetricRow
              icon="trending-up"
              iconBg="#ECFDF5"
              iconColor={colors.green[600]}
              label="Sales"
              value={fmt(data?.month.sales)}
            />
            <MetricRow
              icon="percent"
              iconBg="#EEF2FF"
              iconColor={colors.indigo[500]}
              label="Profit (30%)"
              value={fmt(data?.month.profit)}
              valueStyle={{ color: colors.indigo[600] }}
            />
          </Card>

          {/* All Time */}
          <Card title="All Time">
            <MetricRow
              icon="trending-up"
              iconBg="#ECFDF5"
              iconColor={colors.green[600]}
              label="Total Sales"
              value={fmt(data?.total.sales)}
            />
            <MetricRow
              icon="percent"
              iconBg="#EEF2FF"
              iconColor={colors.indigo[500]}
              label="Total Profit"
              value={fmt(data?.total.profit)}
              valueStyle={{ color: colors.indigo[600] }}
            />
          </Card>
          {weeklyChartData && weeklyChartData.length > 0 && (
            <View style={styles.section}>
              <WeeklyChart weeks={weeklyChartData} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.gray[50] },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  logo: { width: 120, height: 34 },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },

  // Hero
  hero: {
    minHeight: 210,
    padding: 20,
    justifyContent: "space-between",
    gap: 14,
    overflow: "hidden",
  },
  heroImage: { borderRadius: 20 },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroWeekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroWeekKey: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A5B4FC",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  heroGrid: { flexDirection: "row", alignItems: "flex-start" },
  heroGridDivider: {
    width: 1,
    backgroundColor: "#6366F1",
    marginHorizontal: 16,
    alignSelf: "stretch",
  },
  heroStat: { flex: 1, gap: 4 },
  heroLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#C7D2FE",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroValue: { fontSize: 26, fontWeight: "800", color: "#fff" },
  heroDivider: { height: 1, backgroundColor: "rgba(99,102,241,0.5)" },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardBody: {},

  // Icon badge
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // MetricRow
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: 8,
  },
  metricLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  metricLabel: { fontSize: 13, color: colors.gray[700] },
  metricValue: { fontSize: 13, fontWeight: "700", color: colors.gray[900] },

  // Due pill
  duePill: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 8,
    gap: 8,
  },
  duePillRed: { backgroundColor: colors.red[50] },
  duePillGreen: { backgroundColor: colors.green[50] },
  duePillLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  duePillRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  duePillIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  duePillLabel: { fontSize: 13, fontWeight: "700" },
  duePillLabelRed: { color: colors.red[500] },
  duePillLabelGreen: { color: colors.green[600] },
  duePillValue: { fontSize: 15, fontWeight: "800" },
  // Chart
  section: { marginTop: 0 },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[100],
    overflow: "hidden",
    paddingTop: 16,
    paddingBottom: 12,
  },
  chartHeader: {
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  chartTitle: { fontSize: 13, fontWeight: "800", color: colors.gray[900] },
  chartSubtitle: { fontSize: 11, color: colors.gray[400], marginTop: 2 },
  chartLegend: { flexDirection: "row", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 10, color: colors.gray[500], fontWeight: "600" },
  chartScroll: { paddingHorizontal: 16, paddingTop: 12 },
  chartArea: { height: 195, position: "relative" },
  chartGrid: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 4,
    height: 150,
    justifyContent: "space-between",
  },
  chartGridLine: { height: 1, backgroundColor: colors.gray[100] },
  barsContainer: {
    height: 190,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 5,
  },
  chartColumn: {
    width: 42,
    height: 190,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barGroup: {
    height: 154,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  bar: {
    width: 11,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  incomeBar: { backgroundColor: colors.indigo[400] },
  chartMonth: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.gray[400],
    marginTop: 7,
  },
  chartMonthWrap: { alignItems: "center", marginTop: 7, gap: 1 },
  tooltip: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 12,
    gap: 6,
  },
  tooltipTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.gray[700],
    marginBottom: 2,
  },
  tooltipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tooltipText: { fontSize: 12, color: colors.gray[500], flex: 1 },
  tooltipValue: { fontSize: 12, fontWeight: "800", color: colors.gray[900] },
  weekCompareRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  weekCompareCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.gray[50],
    padding: 10,
    gap: 3,
  },
  weekCompareTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  weekCompareDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  weekCompareLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  weekCompareValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.gray[900],
  },
  weekCompareSub: {
    fontSize: 10,
    color: colors.gray[400],
  },
});
