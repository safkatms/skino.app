import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors } from "../ui/theme";
import { font, spacing } from "@/components/ui/typography";

const fmt = (v = 0) => `৳${v.toLocaleString("en-US")}`;

type Period = "week" | "lastWeek" | "month" | "year";

interface PeriodMetrics {
  sales: number;
  profit: number;
  returned: number;
  marketing: number;
  netProfit: number;
  payments?: number;
  due?: number;
  salesChange?: number | null;
  profitChange?: number | null;
}

interface PerformanceOverviewProps {
  week: PeriodMetrics;
  lastWeek: PeriodMetrics;
  month: PeriodMetrics;
  year?: PeriodMetrics;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "lastWeek", label: "Last Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

interface StatCardProps {
  label: string;
  value: string;
  change?: number | null;
  color: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  iconBg: string;
  iconColor: string;
}

function StatCard({
  label,
  value,
  change,
  color,
  icon,
  iconBg,
  iconColor,
}: StatCardProps) {
  const isUp = (change ?? 0) >= 0;

  return (
    <View style={s.statCard}>
      <View style={s.statTop}>
        <View style={[s.statIcon, { backgroundColor: iconBg }]}>
          <Feather name={icon} size={14} color={iconColor} />
        </View>

        {change != null && (
          <View
            style={[
              s.changeBadge,
              { backgroundColor: isUp ? "#ECFDF5" : "#FEF2F2" },
            ]}
          >
            <Feather
              name={isUp ? "arrow-up-right" : "arrow-down-right"}
              size={10}
              color={isUp ? colors.green[600] : colors.red[500]}
            />
            <Text
              style={[
                s.changePct,
                { color: isUp ? colors.green[600] : colors.red[500] },
              ]}
            >
              {Math.abs(change)}%
            </Text>
          </View>
        )}
      </View>

      <Text style={s.statCardLabel}>{label}</Text>
      <Text style={[s.statCardValue, { color }]}>{value}</Text>
    </View>
  );
}

export function PerformanceOverview({
  week,
  lastWeek,
  month,
  year,
}: PerformanceOverviewProps) {
  const [period, setPeriod] = useState<Period>("week");

  const metrics: PeriodMetrics =
    period === "week"
      ? week
      : period === "lastWeek"
        ? lastWeek
        : period === "month"
          ? month
          : (year ?? month);

  const showPayments = metrics.payments != null;
  const showDue = period === "lastWeek" && metrics.due != null;
  const isDue = (metrics.due ?? 0) > 0;

  const statCards: StatCardProps[] = [
    {
      label: "Sales",
      value: fmt(metrics.sales),
      change: metrics.salesChange,
      color: colors.gray[900],
      icon: "shopping-cart",
      iconBg: "#F3F4F6",
      iconColor: colors.gray[500],
    },
    {
      label: "Profit (30%)",
      value: fmt(metrics.profit),
      change: metrics.profitChange,
      color: colors.indigo[600],
      icon: "dollar-sign",
      iconBg: "#EEF2FF",
      iconColor: colors.indigo[500],
    },
    {
      label: "Returned",
      value: fmt(metrics.returned),
      color: colors.orange[500],
      icon: "rotate-ccw",
      iconBg: "#FFF7ED",
      iconColor: colors.orange[500],
    },
    {
      label: "Marketing",
      value: fmt(metrics.marketing),
      color: "#A855F7",
      icon: "radio",
      iconBg: "#FDF4FF",
      iconColor: "#A855F7",
    },
  ];

  if (showPayments) {
    statCards.push({
      label: "Collected",
      value: fmt(metrics.payments),
      color: colors.green[600],
      icon: "download",
      iconBg: "#ECFDF5",
      iconColor: colors.green[600],
    });
  }

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Performance Overview</Text>
          <Text style={s.subtitle}>Track your financial performance</Text>
        </View>
      </View>

      <View style={s.tabs}>
        {PERIODS.map((p) => {
          const active = period === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.tabText, active && s.tabTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.grid}>
        {statCards.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </View>

      <View style={s.netBanner}>
        <View style={s.netLeft}>
          <View style={s.netIcon}>
            <Feather name="trending-up" size={17} color={colors.green[600]} />
          </View>
          <View>
            <Text style={s.netLabel}>Net Profit</Text>
            <Text style={s.netSub}>After marketing expenses</Text>
          </View>
        </View>
        <Text style={s.netValue}>{fmt(metrics.netProfit)}</Text>
      </View>

      {showDue && (
        <View style={[s.dueBanner, isDue ? s.dueBannerRed : s.dueBannerGreen]}>
          <View
            style={[
              s.dueIconWrap,
              { backgroundColor: isDue ? "#FEE2E2" : "#D1FAE5" },
            ]}
          >
            <Feather
              name={isDue ? "alert-circle" : "check-circle"}
              size={15}
              color={isDue ? colors.red[500] : colors.green[600]}
            />
          </View>
          <View style={s.dueContent}>
            <Text style={[s.dueLabel, { color: colors.gray[400] }]}>
              {isDue ? "Outstanding due" : "Fully settled"}
            </Text>
            <Text style={s.dueSub}>
              {isDue ? "Payment remaining" : "No outstanding payment"}
            </Text>
          </View>
          <Text
            style={[
              s.dueValue,
              { color: isDue ? colors.red[500] : colors.green[600] },
            ]}
          >
            {fmt(metrics.due)}
          </Text>
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
    padding: spacing.xl,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: font.xl,
    fontWeight: font.extrabold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: font.xs,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },

  tabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#EEF0F5",
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 9,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.indigo[600],
  },
  tabText: {
    fontSize: font.xs,
    fontWeight: font.semibold,
    color: colors.gray[400],
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: font.bold,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF0F5",
    padding: spacing.lg,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  statCardLabel: {
    fontSize: font.xs,
    fontWeight: font.semibold,
    color: colors.gray[400],
    marginBottom: 3,
  },
  statCardValue: {
    fontSize: font["3xl"],
    fontWeight: font.extrabold,
    letterSpacing: -0.3,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 6,
  },
  changePct: {
    fontSize: font.xs,
    fontWeight: font.bold,
  },

  netBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.green[300],
    padding: 13,
  },
  netLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  netIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.green[50],
    alignItems: "center",
    justifyContent: "center",
  },
  netLabel: {
    fontSize: font.base,
    fontWeight: font.bold,
    color: colors.gray[400],
  },
  netSub: {
    fontSize: font.xs,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
  netValue: {
    fontSize: font["4xl"],
    fontWeight: font.extrabold,
    color: colors.green[600],
    letterSpacing: -0.4,
  },

  dueBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 9,
  },
  dueBannerRed: {
    borderColor: colors.red[300],
  },
  dueBannerGreen: {
    borderColor: colors.green[300],
  },
  dueIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  dueContent: { flex: 1 },
  dueLabel: {
    fontSize: font.base,
    fontWeight: font.bold,
  },
  dueSub: {
    fontSize: font.xs,
    color: colors.gray[400],
    marginTop: 1,
  },
  dueValue: {
    fontSize: font.xl,
    fontWeight: font.extrabold,
  },
});
