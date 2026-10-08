import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ImageBackground,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { api } from "@/lib/axios";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/api-error";
import { colors } from "@/components/ui/theme";
import type { PaginatedResponse } from "@/types/api";

interface MonthlySummary {
  month: string;
  sales: number;
  profit: number;
  payments: number;
  returned: number;
  marketing: number;
  netProfit: number;
  due: number;
}

const fmt = (v: number) =>
  `৳${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const LIMIT = 6;

function parseMonthLabel(month: string): string {
  const [year, mo] = month.split("-");
  const name = new Date(Number(year), Number(mo) - 1).toLocaleString("en-US", {
    month: "long",
  });
  return `${name} ${year}`;
}

export default function MonthlyScreen() {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sales", "summary", "monthly", "paginated", page],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<MonthlySummary>>(
        `/sales/summary/monthly/paginated?page=${page}&limit=${LIMIT}`,
      );
      return res.data;
    },
    placeholderData: (prev) => prev,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Monthly Summary</Text>
      </View>

      {isLoading && !data ? (
        <Spinner fullScreen />
      ) : error ? (
        <View style={{ padding: 20 }}>
          <Alert message={getApiErrorMessage(error)} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
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
            source={require("../../../../assets/month-hero.png")}
            style={styles.hero}
            imageStyle={styles.heroImage}
            resizeMode="cover"
          >
            <View style={styles.heroContent}>
              <View style={styles.heroIconBadge}>
                <Feather name="calendar" size={22} color="#fff" />
              </View>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroEyebrow}>SALES</Text>
                <Text style={styles.heroTitle}>Monthly Summary</Text>
                <Text style={styles.heroSub}>
                  {meta
                    ? `${meta.totalItems} month${meta.totalItems !== 1 ? "s" : ""} on record`
                    : ""}
                </Text>
              </View>
            </View>
          </ImageBackground>

          {/* Month cards */}
          {rows.map((m) => {
            const cleared = m.due <= 0;
            const dateLabel = parseMonthLabel(m.month);
            const accentColor = cleared ? colors.green[500] : colors.red[500];

            const rows2: { label: string; icon: React.ComponentProps<typeof Feather>["name"]; value: string; color: string }[] = [
              { label: "Sales", icon: "shopping-cart", value: fmt(m.sales), color: colors.gray[900] },
              { label: "Profit (30%)", icon: "dollar-sign", value: fmt(m.profit), color: colors.indigo[600] },
              { label: "Net Profit", icon: "trending-up", value: fmt(m.netProfit), color: colors.green[600] },
              { label: "Collected", icon: "download", value: fmt(m.payments), color: colors.green[600] },
              { label: "Returned", icon: "rotate-ccw", value: fmt(m.returned), color: colors.orange[500] },
              { label: "Marketing", icon: "radio", value: fmt(m.marketing), color: "#A855F7" },
              { label: "Due", icon: "file-text", value: fmt(Math.abs(m.due)), color: m.due > 0 ? colors.red[500] : colors.gray[400] },
            ];

            return (
              <View
                key={m.month}
                style={[styles.card, { borderLeftColor: accentColor }]}
              >
                {/* Card header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Feather name="calendar" size={15} color={accentColor} />
                    <View>
                      <Text style={styles.cardDateLabel}>{dateLabel}</Text>
                      <Text style={styles.cardMonthKey}>{m.month}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      cleared ? styles.badgeGreen : styles.badgeRed,
                    ]}
                  >
                    <Feather
                      name={cleared ? "check-circle" : "alert-circle"}
                      size={11}
                      color={cleared ? colors.green[600] : colors.red[500]}
                      style={{ marginRight: 3 }}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        cleared ? styles.badgeTextGreen : styles.badgeTextRed,
                      ]}
                    >
                      {cleared ? "Cleared" : "Due"}
                    </Text>
                  </View>
                </View>

                {/* Metric rows */}
                <View style={styles.metricList}>
                  {rows2.map((r, i) => (
                    <View
                      key={r.label}
                      style={[
                        styles.metricRow,
                        i < rows2.length - 1 && styles.metricRowBorder,
                        r.label === "Sales" && styles.metricRowSales,
                      ]}
                    >
                      <View style={styles.metricLabelRow}>
                        <Feather
                          name={r.icon}
                          size={r.label === "Sales" ? 14 : 12}
                          color={r.color}
                        />
                        <Text
                          style={[
                            styles.metricLabel,
                            r.label === "Sales" && styles.metricLabelSales,
                          ]}
                        >
                          {r.label}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.metricValue,
                          { color: r.color },
                          r.label === "Sales" && styles.metricValueSales,
                        ]}
                      >
                        {r.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={styles.pageBtn}
                onPress={() => {
                  setPage((p) => Math.max(1, p - 1));
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
                disabled={page === 1}
                activeOpacity={0.7}
              >
                <Feather
                  name="chevron-left"
                  size={16}
                  color={page === 1 ? colors.gray[300] : colors.gray[700]}
                />
              </TouchableOpacity>
              <Text style={styles.pageIndicator}>
                Page <Text style={styles.pageNum}>{page}</Text> of {totalPages}
              </Text>
              <TouchableOpacity
                style={styles.pageBtn}
                onPress={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
                disabled={page === totalPages}
                activeOpacity={0.7}
              >
                <Feather
                  name="chevron-right"
                  size={16}
                  color={
                    page === totalPages ? colors.gray[300] : colors.gray[700]
                  }
                />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F5F9" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: colors.gray[900] },

  scrollContent: { padding: 16, gap: 10, paddingBottom: 40 },

  hero: {
    borderRadius: 20,
    minHeight: 130,
    padding: 18,
    overflow: "hidden",
    justifyContent: "center",
  },
  heroImage: { borderRadius: 20 },
  heroContent: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextBlock: { gap: 2 },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.2,
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  heroSub: { fontSize: 12, color: "rgba(255,255,255,0.65)" },

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
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardDateLabel: { fontSize: 13, fontWeight: "700", color: colors.gray[900] },
  cardMonthKey: { fontSize: 10, color: colors.gray[400], marginTop: 1 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeGreen: {
    backgroundColor: "#ECFDF5",
    borderColor: colors.green[200],
    borderWidth: 1,
  },
  badgeRed: {
    backgroundColor: "#FEF2F2",
    borderColor: colors.red[200],
    borderWidth: 1,
  },
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
  metricRowSales: { paddingVertical: 10 },
  metricLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metricLabel: { fontSize: 13, color: colors.gray[500], fontWeight: "500" },
  metricLabelSales: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[700],
  },
  metricValue: { fontSize: 13, fontWeight: "700" },
  metricValueSales: { fontSize: 16, fontWeight: "800" },

  paginationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pageBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  pageIndicator: { fontSize: 13, color: colors.gray[400] },
  pageNum: { fontWeight: "800", color: colors.gray[900] },
});
