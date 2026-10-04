import React from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { font, spacing } from "@/components/ui/typography";

interface HeroMetrics {
  weekSales: number;
  weekProfit: number;
  todaySales: number;
  todayProfit: number;
  currentWeekKey: string;
  lastWeekSales?: number;
  lastWeekProfit?: number;
}

const fmt = (v = 0) => `৳${v.toLocaleString("en-US")}`;

function getDateRange(weekKey: string): string {
  const parts = weekKey.split("_");
  if (parts.length < 2) return weekKey;

  function parseCompact(s: string): Date {
    const year = parseInt(s.slice(0, 4));
    const month = parseInt(s.slice(4, 6)) - 1;
    const day = parseInt(s.slice(6, 8));
    return new Date(year, month, day);
  }

  const start = parseCompact(parts[0]);
  const end = parseCompact(parts[1]);

  return `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

function StatBlock({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change?: { pct: number; vs: string };
}) {
  const isUp = (change?.pct ?? 0) >= 0;
  return (
    <View style={s.statBlock}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
      {change && (
        <View style={s.changeRow}>
          <Feather
            name={isUp ? "arrow-up-right" : "arrow-down-right"}
            size={12}
            color={isUp ? "#4ADE80" : "#F87171"}
          />
          <Text style={[s.changePct, { color: isUp ? "#4ADE80" : "#F87171" }]}>
            {Math.abs(change.pct)}%
          </Text>
          <Text style={s.changeVs}>{change.vs}</Text>
        </View>
      )}
    </View>
  );
}

interface DashboardHeroProps {
  metrics: HeroMetrics;
}

export function DashboardHero({ metrics }: DashboardHeroProps) {
  const {
    weekSales,
    weekProfit,
    todaySales,
    todayProfit,
    currentWeekKey,
    lastWeekSales,
    lastWeekProfit,
  } = metrics;

  const weekSalesPct =
    lastWeekSales && lastWeekSales > 0
      ? Math.round(((weekSales - lastWeekSales) / lastWeekSales) * 100)
      : null;
  const weekProfitPct =
    lastWeekProfit && lastWeekProfit > 0
      ? Math.round(((weekProfit - lastWeekProfit) / lastWeekProfit) * 100)
      : null;

  return (
    <ImageBackground
      source={require("../../../assets/dashboard-hero.png")}
      style={s.hero}
      imageStyle={s.heroImage}
      resizeMode="cover"
    >
      <View style={s.topRow}>
        <View style={{ gap: spacing.xs }}>
          <Text style={s.weekTitle}>This week</Text>
          <Text style={s.dateRange}>
            {currentWeekKey ? getDateRange(currentWeekKey) : "—"}
          </Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <StatBlock
          label="Sales"
          value={fmt(weekSales)}
          change={
            weekSalesPct !== null
              ? { pct: weekSalesPct, vs: "vs last week" }
              : undefined
          }
        />
        <View style={s.dividerV} />
        <StatBlock
          label="Profit"
          value={fmt(weekProfit)}
          change={
            weekProfitPct !== null
              ? { pct: weekProfitPct, vs: "vs last week" }
              : undefined
          }
        />
      </View>

      <View style={s.dividerH} />
      <View style={s.statsRow}>
        <StatBlock label="Today Sales" value={fmt(todaySales)} />
        <View style={s.dividerV} />
        <StatBlock label="Today Profit" value={fmt(todayProfit)} />
      </View>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  hero: {
    padding: spacing["3xl"],
    gap: spacing.xl,
    overflow: "hidden",
  },
  heroImage: { borderRadius: 20 },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  weekTitle: {
    fontSize: font.lg,
    fontWeight: font.bold,
    color: "#fff",
  },
  dateRange: {
    fontSize: font.base,
    fontWeight: font.regular,
    color: "#C7D2FE",
    marginTop: 1,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dividerV: {
    width: 1,
    backgroundColor: "rgba(99,102,241,0.5)",
    marginHorizontal: spacing.xl,
    alignSelf: "stretch",
  },
  dividerH: {
    height: 1,
    backgroundColor: "rgba(99,102,241,0.5)",
  },

  statBlock: { flex: 1, gap: spacing.sm },
  statLabel: {
    fontSize: font.xs,
    fontWeight: font.semibold,
    color: "#C7D2FE",
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: font.hero,
    fontWeight: font.extrabold,
    color: "#fff",
    letterSpacing: -0.5,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: spacing.xs,
  },
  changePct: { fontSize: font.md, fontWeight: font.bold },
  changeVs: { fontSize: font.base, color: "#C7D2FE", fontWeight: font.regular },
});
