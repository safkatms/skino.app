import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
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
import type { ApiResponse } from "@/types/api";
import Feather from "@expo/vector-icons/Feather";
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

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroLabel}>{label}</Text>
      <Text style={styles.heroValue}>{value}</Text>
    </View>
  );
}

function MetricRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
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

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setAuthenticated } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardData>>("/sales/dashboard");
      console.log("Dashboard data:", res.data.data);
      return res.data.data!;
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
        <TouchableOpacity onPress={handleLogout} hitSlop={8}>
          <Feather name="log-out" size={20} color={colors.gray[500]} />
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
          <View style={styles.hero}>
            <Text style={styles.heroWeekKey}>
              {data?.currentWeekKey ?? "Current Week"}
            </Text>
            <View style={styles.heroGrid}>
              <HeroStat label="Week Sales" value={fmt(data?.week.sales)} />
              <HeroStat label="Week Profit" value={fmt(data?.week.profit)} />
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroGrid}>
              <HeroStat label="Today Sales" value={fmt(data?.today.sales)} />
              <HeroStat label="Today Profit" value={fmt(data?.today.profit)} />
            </View>
          </View>

          {/* Last Week */}
          <Card title={`Last Week · ${data?.lastWeekKey ?? ""}`}>
            <MetricRow label="Gross Sales" value={fmt(data?.lastWeek.sales)} />
            <MetricRow
              label="Profit (30%)"
              value={fmt(data?.lastWeek.profit)}
              valueStyle={{ color: colors.indigo[600] }}
            />
            <MetricRow
              label="Collected"
              value={fmt(data?.lastWeek.payments)}
              valueStyle={{ color: colors.green[600] }}
            />
            <MetricRow
              label="Returned"
              value={fmt(data?.lastWeek.returned)}
              valueStyle={{ color: colors.orange[500] }}
            />
            {/* Due pill */}
            {(() => {
              const due = data?.lastWeek.due ?? 0;
              return (
                <View
                  style={[
                    styles.duePill,
                    due > 0 ? styles.duePillRed : styles.duePillGreen,
                  ]}
                >
                  <Text
                    style={[
                      styles.duePillLabel,
                      due > 0
                        ? styles.duePillLabelRed
                        : styles.duePillLabelGreen,
                    ]}
                  >
                    {due > 0 ? "Outstanding Due" : "Fully Settled"}
                  </Text>
                  <Text
                    style={[
                      styles.duePillValue,
                      due > 0
                        ? { color: colors.red[600] }
                        : { color: colors.green[600] },
                    ]}
                  >
                    {fmt(due)}
                  </Text>
                </View>
              );
            })()}
          </Card>

          <Card title="This Month">
            <MetricRow label="Sales" value={fmt(data?.month.sales)} />
            <MetricRow
              label="Profit (30%)"
              value={fmt(data?.month.profit)}
              valueStyle={{ color: colors.indigo[600] }}
            />
          </Card>

          <Card title="All Time">
            <MetricRow label="Total Sales" value={fmt(data?.total.sales)} />
            <MetricRow
              label="Total Profit"
              value={fmt(data?.total.profit)}
              valueStyle={{ color: colors.indigo[600] }}
            />
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.gray[50] },
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
  headerTitle: { fontSize: 18, fontWeight: "800", color: colors.indigo[600] },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 24 },

  // Hero
  hero: {
    backgroundColor: colors.indigo[600],
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  heroWeekKey: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A5B4FC",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  heroGrid: { flexDirection: "row", gap: 0 },
  heroStat: { flex: 1, gap: 2 },
  heroLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#C7D2FE",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroValue: { fontSize: 22, fontWeight: "800", color: "#fff" },
  heroDivider: { height: 1, backgroundColor: "#6366F1" },

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

  // MetricRow
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  metricLabel: { fontSize: 13, color: colors.gray[500] },
  metricValue: { fontSize: 13, fontWeight: "700", color: colors.gray[900] },

  // Due pill
  duePill: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 8,
    marginBottom: 8,
  },
  duePillRed: { backgroundColor: colors.red[50] },
  duePillGreen: { backgroundColor: colors.green[50] },
  duePillLabel: { fontSize: 13, fontWeight: "700" },
  duePillLabelRed: { color: colors.red[500] },
  duePillLabelGreen: { color: colors.green[600] },
  duePillValue: { fontSize: 15, fontWeight: "800" },
  logo: { width: 120, height: 34 },
});
