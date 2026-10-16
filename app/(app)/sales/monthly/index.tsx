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
import { SummaryCard } from "@/components/sales/SummaryCard";

interface MonthlySummary {
  month: string;
  sales: number;
  profit: number;
  payments: number;
  returned: number;
  marketing: number;
  netProfit: number;
  actualProfit: number;
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
          {rows.map((m) => (
            <SummaryCard
              key={m.month}
              dateLabel={parseMonthLabel(m.month)}
              subLabel={m.month}
              settled={m.due <= 0}
              settledLabel="Cleared"
              metrics={[
                { label: "Sales", icon: "shopping-cart", value: fmt(m.sales), color: colors.gray[900], hero: true },
                { label: "Profit (30%)", icon: "dollar-sign", value: fmt(m.profit), color: colors.indigo[600] },
                { label: "Net Profit", icon: "trending-up", value: fmt(m.netProfit), color: colors.green[600] },
                { label: "Collected", icon: "download", value: fmt(m.payments), color: colors.green[600] },
                { label: "Actual Profit", icon: "check-square", value: fmt(m.actualProfit), color: colors.indigo[600] },
                { label: "Returned", icon: "rotate-ccw", value: fmt(m.returned), color: colors.orange[500] },
                { label: "Marketing", icon: "radio", value: fmt(m.marketing), color: "#A855F7" },
                { label: "Due", icon: "file-text", value: fmt(Math.abs(m.due)), color: m.due > 0 ? colors.red[500] : colors.gray[400] },
              ]}
            />
          ))}

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
