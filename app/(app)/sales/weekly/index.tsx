import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ImageBackground,
  Animated,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/axios";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/api-error";
import { colors } from "@/components/ui/theme";
import type { PaginatedResponse } from "@/types/api";
import { WeeklySummary } from "@/components/dashboard/WeeklyTrend";

function SkeletonBox({
  w,
  h,
  r = 8,
  opacity,
}: {
  w: number | string;
  h: number;
  r?: number;
  opacity: Animated.Value;
}) {
  return (
    <Animated.View
      style={{
        width: w as any,
        height: h,
        borderRadius: r,
        backgroundColor: colors.gray[200],
        opacity,
      }}
    />
  );
}

function SkeletonCard({ opacity }: { opacity: Animated.Value }) {
  return (
    <View style={sk.card}>
      {/* header */}
      <View style={sk.row}>
        <SkeletonBox w={34} h={34} r={10} opacity={opacity} />
        <View style={{ gap: 6, flex: 1 }}>
          <SkeletonBox w="60%" h={12} opacity={opacity} />
          <SkeletonBox w="35%" h={9} opacity={opacity} />
        </View>
        <SkeletonBox w={56} h={22} r={20} opacity={opacity} />
      </View>
      {/* sales row */}
      <View style={[sk.row, { borderTopWidth: 1, borderTopColor: "#F3F4F6" }]}>
        <SkeletonBox w={38} h={38} r={12} opacity={opacity} />
        <View style={{ gap: 5 }}>
          <SkeletonBox w={50} h={10} opacity={opacity} />
          <SkeletonBox w={110} h={18} r={6} opacity={opacity} />
        </View>
      </View>
      {/* profit tiles */}
      <View style={sk.tileRow}>
        <SkeletonBox w="47%" h={64} r={12} opacity={opacity} />
        <SkeletonBox w="47%" h={64} r={12} opacity={opacity} />
      </View>
      {/* small tiles */}
      <View style={[sk.tileRow, { paddingBottom: 12 }]}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 5 }}>
            <SkeletonBox w={28} h={28} r={8} opacity={opacity} />
            <SkeletonBox w={36} h={9} opacity={opacity} />
            <SkeletonBox w={44} h={11} opacity={opacity} />
          </View>
        ))}
      </View>
    </View>
  );
}

function WeeklySkeleton() {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [anim]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    >
      {/* hero placeholder */}
      <Animated.View style={[sk.hero, { opacity: anim }]} />
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} opacity={anim} />
      ))}
    </ScrollView>
  );
}

const fmt = (v: number) =>
  `৳${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const LIMIT = 8;

function parseWeekLabel(weekKey: string): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const [s, e] = weekKey.split("_");
  const sd = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
  const ed = new Date(+e.slice(0, 4), +e.slice(4, 6) - 1, +e.slice(6, 8));
  const sm = months[sd.getMonth()];
  const em = months[ed.getMonth()];
  const sy = sd.getFullYear();
  const ey = ed.getFullYear();
  if (sy === ey && sm === em)
    return `${sm} ${sd.getDate()} – ${ed.getDate()}, ${sy}`;
  if (sy === ey) return `${sm} ${sd.getDate()} – ${em} ${ed.getDate()}, ${sy}`;
  return `${sm} ${sd.getDate()}, ${sy} – ${em} ${ed.getDate()}, ${ey}`;
}

export default function WeeklyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [ready, setReady] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { data, error, refetch } = useQuery({
    queryKey: ["sales", "summary", "weekly", "paginated", page],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<WeeklySummary>>(
        `/sales/summary/weekly/paginated?page=${page}&limit=${LIMIT}`,
      );
      return res.data;
    },
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (data) setReady(true);
  }, [data]);

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
        <Text style={styles.headerTitle}>Weekly Ledger</Text>
      </View>

      {!ready ? (
        <WeeklySkeleton />
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
            source={require("../../../../assets/week-hero.png")}
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
                <Text style={styles.heroTitle}>Weekly Ledger</Text>
                <Text style={styles.heroSub}>
                  {meta
                    ? `${meta.totalItems} week${meta.totalItems !== 1 ? "s" : ""} on record`
                    : ""}
                </Text>
              </View>
            </View>
          </ImageBackground>

          {/* Week cards */}
          {rows.map((w) => {
            const settled = w.due <= 0;
            const dateLabel = parseWeekLabel(w.weekKey);

            return (
              <TouchableOpacity
                key={w.weekKey}
                style={styles.card}
                onPress={() =>
                  router.push(`/(app)/sales/entries/${w.weekKey}` as any)
                }
                activeOpacity={0.85}
              >
                {/* Card header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.calIconBg,
                        settled ? styles.calIconBgGreen : styles.calIconBgRed,
                      ]}
                    >
                      <Feather
                        name="calendar"
                        size={18}
                        color={settled ? colors.green[600] : colors.red[500]}
                      />
                    </View>
                    <View>
                      <Text style={styles.cardDateLabel}>{dateLabel}</Text>
                      <Text style={styles.cardWeekKey}>{w.weekKey}</Text>
                    </View>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <View
                      style={[
                        styles.badge,
                        settled ? styles.badgeGreen : styles.badgeRed,
                      ]}
                    >
                      {!settled && (
                        <Feather
                          name="alert-circle"
                          size={11}
                          color={colors.red[500]}
                          style={{ marginRight: 3 }}
                        />
                      )}
                      {settled && (
                        <Feather
                          name="check-circle"
                          size={11}
                          color={colors.green[600]}
                          style={{ marginRight: 3 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.badgeText,
                          settled ? styles.badgeTextGreen : styles.badgeTextRed,
                        ]}
                      >
                        {settled ? "Settled" : "Due"}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={16}
                      color={colors.gray[400]}
                    />
                  </View>
                </View>

                {/* Sales hero row */}
                <View style={styles.salesRow}>
                  <View style={styles.salesIconBg}>
                    <Feather
                      name="shopping-cart"
                      size={20}
                      color={colors.gray[500]}
                    />
                  </View>
                  <View style={styles.salesTextBlock}>
                    <Text style={styles.salesLabel}>Sales</Text>
                    <Text style={styles.salesValue}>{fmt(w.sales)}</Text>
                  </View>
                </View>

                {/* Profit + Net Profit tiles */}
                <View style={styles.tileRow}>
                  <View style={[styles.tile, styles.tilePurple]}>
                    <View style={styles.tileIconBg}>
                      <Feather
                        name="dollar-sign"
                        size={16}
                        color={colors.indigo[600]}
                      />
                    </View>
                    <Text style={styles.tileLabel}>Profit (30%)</Text>
                    <Text
                      style={[styles.tileValue, { color: colors.indigo[600] }]}
                    >
                      {fmt(w.profit)}
                    </Text>
                  </View>
                  <View style={[styles.tile, styles.tileGreen]}>
                    <View style={[styles.tileIconBg]}>
                      <Feather
                        name="trending-up"
                        size={16}
                        color={colors.green[600]}
                      />
                    </View>
                    <Text style={styles.tileLabel}>Net Profit</Text>
                    <Text
                      style={[styles.tileValue, { color: colors.green[600] }]}
                    >
                      {fmt(w.netProfit)}
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
                        size={13}
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
                      {fmt(w.returned)}
                    </Text>
                  </View>
                  <View style={styles.smallTile}>
                    <View
                      style={[
                        styles.smallIconBg,
                        { backgroundColor: "#FDF4FF" },
                      ]}
                    >
                      <Feather name="radio" size={13} color="#A855F7" />
                    </View>
                    <Text style={styles.smallTileLabel}>Marketing</Text>
                    <Text style={[styles.smallTileValue, { color: "#A855F7" }]}>
                      {fmt(w.marketing)}
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
                        size={13}
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
                      {fmt(w.payments)}
                    </Text>
                  </View>
                  <View style={styles.smallTile}>
                    <View
                      style={[
                        styles.smallIconBg,
                        { backgroundColor: w.due > 0 ? "#FEF2F2" : "#F3F4F6" },
                      ]}
                    >
                      <Feather
                        name="file-text"
                        size={13}
                        color={w.due > 0 ? colors.red[500] : colors.gray[400]}
                      />
                    </View>
                    <Text style={styles.smallTileLabel}>Due</Text>
                    <Text
                      style={[
                        styles.smallTileValue,
                        {
                          color: w.due > 0 ? colors.red[500] : colors.gray[400],
                        },
                      ]}
                    >
                      {fmt(Math.abs(w.due))}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={styles.pageBtn}
                onPress={() => { setPage((p) => Math.max(1, p - 1)); scrollRef.current?.scrollTo({ y: 0, animated: true }); }}
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
                onPress={() => { setPage((p) => Math.min(totalPages, p + 1)); scrollRef.current?.scrollTo({ y: 0, animated: true }); }}
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

  // Hero
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

  // Card
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEF0F5",
    borderRadius: 18,
    overflow: "hidden",
  },

  // Card header
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
  cardWeekKey: { fontSize: 10, color: colors.gray[400], marginTop: 1 },

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

  // Sales hero row
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

  // Profit + Net Profit 2-col tiles
  tileRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  tilePurple: { borderColor: colors.indigo[300] },
  tileGreen: { borderColor: colors.green[300] },
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

  // 4-item small tiles
  smallTileRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  smallTile: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  smallIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  smallTileLabel: { fontSize: 10, color: colors.gray[400], fontWeight: "500" },
  smallTileValue: { fontSize: 11, fontWeight: "700" },

  // Pagination
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

const sk = StyleSheet.create({
  hero: {
    height: 130,
    borderRadius: 20,
    backgroundColor: colors.gray[200],
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEF0F5",
    borderRadius: 18,
    overflow: "hidden",
    gap: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tileRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
});
