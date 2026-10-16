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
import { SummaryCard } from "@/components/sales/SummaryCard";

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
          {rows.map((w) => (
            <SummaryCard
              key={w.weekKey}
              dateLabel={parseWeekLabel(w.weekKey)}
              subLabel={w.weekKey}
              settled={w.due <= 0}
              settledLabel="Settled"
              onPress={() => router.push(`/(app)/sales/entries/${w.weekKey}` as any)}
              metrics={[
                { label: "Sales", icon: "shopping-cart", value: fmt(w.sales), color: colors.gray[900], hero: true },
                { label: "Profit (30%)", icon: "dollar-sign", value: fmt(w.profit), color: colors.indigo[600] },
                { label: "Net Profit", icon: "trending-up", value: fmt(w.netProfit), color: colors.green[600] },
                { label: "Collected", icon: "download", value: fmt(w.payments), color: colors.green[600] },
                { label: "Actual Profit", icon: "check-square", value: fmt(w.actualProfit), color: colors.indigo[600] },
                { label: "Returned", icon: "rotate-ccw", value: fmt(w.returned), color: colors.orange[500] },
                { label: "Marketing", icon: "radio", value: fmt(w.marketing), color: "#A855F7" },
                { label: "Due", icon: "file-text", value: fmt(Math.abs(w.due)), color: w.due > 0 ? colors.red[500] : colors.gray[400] },
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
