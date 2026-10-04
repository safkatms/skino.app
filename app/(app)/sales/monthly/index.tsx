import React, { useState } from "react";
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

            return (
              <View key={m.month} style={styles.card}>
                {/* Card header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.calIconBg,
                        cleared ? styles.calIconBgGreen : styles.calIconBgRed,
                      ]}
                    >
                      <Feather
                        name="calendar"
                        size={18}
                        color={cleared ? colors.green[600] : colors.red[500]}
                      />
                    </View>
                    <View>
                      <Text style={styles.cardDateLabel}>{dateLabel}</Text>
                      <Text style={styles.cardMonthKey}>{m.month}</Text>
                    </View>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <View
                      style={[
                        styles.badge,
                        cleared ? styles.badgeGreen : styles.badgeRed,
                      ]}
                    >
                      {cleared ? (
                        <Feather
                          name="check-circle"
                          size={11}
                          color={colors.green[600]}
                          style={{ marginRight: 3 }}
                        />
                      ) : (
                        <Feather
                          name="alert-circle"
                          size={11}
                          color={colors.red[500]}
                          style={{ marginRight: 3 }}
                        />
                      )}
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
                </View>

                {/* Sales hero row */}
                <View style={styles.salesRow}>
                  <View style={styles.salesIconBg}>
                    <Feather
                      name="shopping-cart"
                      size={18}
                      color={colors.gray[500]}
                    />
                  </View>
                  <View style={styles.salesTextBlock}>
                    <Text style={styles.salesLabel}>Sales</Text>
                    <Text style={styles.salesValue}>{fmt(m.sales)}</Text>
                  </View>
                </View>

                {/* Profit + Net Profit tiles */}
                <View style={styles.tileRow}>
                  <View style={[styles.tile, styles.tilePurple]}>
                    <View style={styles.tileIconBg}>
                      <Feather
                        name="dollar-sign"
                        size={14}
                        color={colors.indigo[600]}
                      />
                    </View>
                    <Text style={styles.tileLabel}>Profit (30%)</Text>
                    <Text
                      style={[styles.tileValue, { color: colors.indigo[600] }]}
                    >
                      {fmt(m.profit)}
                    </Text>
                  </View>
                  <View style={[styles.tile, styles.tileGreen]}>
                    <View style={styles.tileIconBg}>
                      <Feather
                        name="trending-up"
                        size={14}
                        color={colors.green[600]}
                      />
                    </View>
                    <Text style={styles.tileLabel}>Net Profit</Text>
                    <Text
                      style={[styles.tileValue, { color: colors.green[600] }]}
                    >
                      {fmt(m.netProfit)}
                    </Text>
                  </View>
                </View>

                {/* 4-item small tile row */}
                <View style={styles.smallTileRow}>
                  <View style={styles.smallTile}>
                    <View
                      style={[
                        styles.smallIconBg,
                        { backgroundColor: "#FFF7ED" },
                      ]}
                    >
                      <Feather
                        name="rotate-ccw"
                        size={12}
                        color={colors.orange[500]}
                      />
                    </View>
                    <Text style={styles.smallTileLabel}>Returned</Text>
                    <Text
                      style={[
                        styles.smallTileValue,
                        { color: colors.orange[500] },
                      ]}
                    >
                      {fmt(m.returned)}
                    </Text>
                  </View>
                  <View style={styles.smallTile}>
                    <View
                      style={[
                        styles.smallIconBg,
                        { backgroundColor: "#FDF4FF" },
                      ]}
                    >
                      <Feather name="radio" size={12} color="#A855F7" />
                    </View>
                    <Text style={styles.smallTileLabel}>Marketing</Text>
                    <Text style={[styles.smallTileValue, { color: "#A855F7" }]}>
                      {fmt(m.marketing)}
                    </Text>
                  </View>
                  <View style={styles.smallTile}>
                    <View
                      style={[
                        styles.smallIconBg,
                        { backgroundColor: "#ECFDF5" },
                      ]}
                    >
                      <Feather
                        name="download"
                        size={12}
                        color={colors.green[600]}
                      />
                    </View>
                    <Text style={styles.smallTileLabel}>Collected</Text>
                    <Text
                      style={[
                        styles.smallTileValue,
                        { color: colors.green[600] },
                      ]}
                    >
                      {fmt(m.payments)}
                    </Text>
                  </View>
                  <View style={styles.smallTile}>
                    <View
                      style={[
                        styles.smallIconBg,
                        {
                          backgroundColor: m.due > 0 ? "#FEF2F2" : "#F3F4F6",
                        },
                      ]}
                    >
                      <Feather
                        name="file-text"
                        size={12}
                        color={m.due > 0 ? colors.red[500] : colors.gray[400]}
                      />
                    </View>
                    <Text style={styles.smallTileLabel}>Due</Text>
                    <Text
                      style={[
                        styles.smallTileValue,
                        {
                          color: m.due > 0 ? colors.red[500] : colors.gray[400],
                        },
                      ]}
                    >
                      {fmt(Math.abs(m.due))}
                    </Text>
                  </View>
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
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
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
    borderWidth: 1,
    borderColor: "#EEF0F5",
    borderRadius: 18,
    overflow: "hidden",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  cardDateLabel: { fontSize: 13, fontWeight: "700", color: colors.gray[900] },
  cardMonthKey: { fontSize: 10, color: colors.gray[400], marginTop: 1 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeGreen: { borderColor: colors.green[100], borderWidth: 1 },
  badgeRed: { borderColor: colors.red[100], borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  badgeTextGreen: { color: colors.green[600] },
  badgeTextRed: { color: colors.red[500] },

  salesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  salesIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  salesTextBlock: { gap: 1 },
  salesLabel: { fontSize: 11, color: colors.gray[500], fontWeight: "600" },
  salesValue: { fontSize: 20, fontWeight: "800", color: colors.gray[900] },

  tileRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tile: { flex: 1, borderRadius: 12, padding: 10, gap: 4 },
  tilePurple: { borderColor: colors.indigo[300], borderWidth: 1 },
  tileGreen: { borderColor: colors.green[300], borderWidth: 1 },
  tileIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: { fontSize: 11, color: colors.gray[500], fontWeight: "500" },
  tileValue: { fontSize: 13, fontWeight: "800" },

  smallTileRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  smallTile: { flex: 1, alignItems: "center", gap: 3 },
  smallIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  smallTileLabel: { fontSize: 10, color: colors.gray[400], fontWeight: "500" },
  smallTileValue: { fontSize: 11, fontWeight: "700" },

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
