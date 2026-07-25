import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { api } from "@/lib/axios";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/api-error";
import { colors } from "@/components/ui/theme";
import type { PaginatedResponse } from "@/types/api";

interface WeeklySummary {
  weekKey: string;
  label: string;
  sales: number;
  profit: number;
  payments: number;
  returned: number;
  due: number;
}

const fmt = (v: number) =>
  `৳${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const LIMIT = 8;

export default function WeeklyScreen() {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sales", "summary", "weekly", "paginated", page],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<WeeklySummary>>(
        `/sales/summary/weekly/paginated?page=${page}&limit=${LIMIT}`,
      );
      return res.data;
    },
    placeholderData: (prev) => prev,
  });
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weekly Ledger</Text>
      </View>

      {isLoading && !data ? (
        <Spinner fullScreen />
      ) : error ? (
        <View style={{ padding: 20 }}>
          <Alert message={getApiErrorMessage(error)} />
        </View>
      ) : (
        <ScrollView
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
            <Text style={styles.heroEyebrow}>Sales</Text>
            <Text style={styles.heroTitle}>Weekly Ledger</Text>
            <Text style={styles.heroSub}>
              {meta
                ? `${meta.totalItems} week${meta.totalItems !== 1 ? "s" : ""} on record`
                : "Loading..."}
            </Text>
          </View>

          {/* Week cards */}
          {rows.map((w) => {
            const settled = w.due <= 0;
            return (
              <View key={w.weekKey} style={styles.card}>
                {/* Card header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardWeekLabel}>{w.label}</Text>
                    <Text style={styles.cardWeekKey}>{w.weekKey}</Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      settled ? styles.badgeGreen : styles.badgeRed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        settled ? styles.badgeTextGreen : styles.badgeTextRed,
                      ]}
                    >
                      {settled ? "Settled" : `Due ${fmt(w.due)}`}
                    </Text>
                  </View>
                </View>

                {/* Metrics */}
                <View style={styles.cardBody}>
                  {[
                    {
                      label: "Gross Sales",
                      value: fmt(w.sales),
                      color: colors.gray[900],
                    },
                    {
                      label: "Profit (30%)",
                      value: fmt(w.profit),
                      color: colors.indigo[600],
                    },
                    {
                      label: "Collected",
                      value: fmt(w.payments),
                      color: colors.green[600],
                    },
                    {
                      label: "Returned",
                      value: fmt(w.returned),
                      color: colors.orange[500],
                    },
                  ].map(({ label, value, color }, i, arr) => (
                    <View
                      key={label}
                      style={[
                        styles.row,
                        i < arr.length - 1 && styles.rowBorder,
                      ]}
                    >
                      <Text style={styles.rowLabel}>{label}</Text>
                      <Text style={[styles.rowValue, { color }]}>{value}</Text>
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
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                activeOpacity={0.7}
              >
                <ChevronLeft
                  size={16}
                  color={page === 1 ? colors.gray[300] : colors.gray[500]}
                />
                <Text
                  style={[
                    styles.pageBtnText,
                    page === 1 && styles.pageBtnDisabled,
                  ]}
                >
                  Prev
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageIndicator}>
                <Text style={styles.pageNum}>{page}</Text>
                {" of "}
                {totalPages}
              </Text>

              <TouchableOpacity
                style={styles.pageBtn}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pageBtnText,
                    page === totalPages && styles.pageBtnDisabled,
                  ]}
                >
                  Next
                </Text>
                <ChevronRight
                  size={16}
                  color={
                    page === totalPages ? colors.gray[300] : colors.gray[500]
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
  root: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: colors.gray[900] },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },

  hero: {
    backgroundColor: colors.indigo[600],
    borderRadius: 20,
    padding: 20,
    gap: 2,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A5B4FC",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginTop: 2 },
  heroSub: { fontSize: 13, color: "#C7D2FE", marginTop: 2 },

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
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  cardWeekLabel: { fontSize: 13, fontWeight: "700", color: colors.gray[900] },
  cardWeekKey: { fontSize: 11, color: colors.gray[400], marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeGreen: { backgroundColor: colors.green[50] },
  badgeRed: { backgroundColor: colors.red[50] },
  badgeText: { fontSize: 11, fontWeight: "700" },
  badgeTextGreen: { color: colors.green[600] },
  badgeTextRed: { color: colors.red[500] },
  cardBody: { paddingHorizontal: 16, paddingVertical: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  rowLabel: { fontSize: 13, color: colors.gray[500] },
  rowValue: { fontSize: 13, fontWeight: "700" },

  paginationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pageBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  pageBtnText: { fontSize: 13, fontWeight: "700", color: colors.gray[500] },
  pageBtnDisabled: { color: colors.gray[300] },
  pageIndicator: { fontSize: 13, color: colors.gray[400] },
  pageNum: { fontWeight: "800", color: colors.gray[900] },
});
