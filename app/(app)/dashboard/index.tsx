import React, { useMemo } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
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
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { PerformanceOverview } from "@/components/dashboard/PerformanceOverview";
import { WeeklySummary, WeeklyTrend } from "@/components/dashboard/WeeklyTrend";

interface Metrics {
  sales: number;
  profit: number;
  payments?: number;
  returned: number;
  marketing: number;
  netProfit: number;
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

export default function DashboardScreen() {
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
  const weekSalesPct =
    data && data.lastWeek.sales > 0
      ? Math.round(
          ((data.week.sales - data.lastWeek.sales) / data.lastWeek.sales) * 100,
        )
      : null;
  const weekProfitPct =
    data && data.lastWeek.profit > 0
      ? Math.round(
          ((data.week.profit - data.lastWeek.profit) / data.lastWeek.profit) *
            100,
        )
      : null;
  return (
    <View style={[{ flex: 1, backgroundColor: colors.gray[50] }]}>
      {/* Header */}
      <DashboardHeader onLogoutPress={handleLogout} />

      {isLoading ? (
        <Spinner fullScreen />
      ) : error ? (
        <View style={{ padding: 20 }}>
          <Alert message={getApiErrorMessage(error)} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
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
          <DashboardHero
            metrics={{
              weekSales: data?.week.sales ?? 0,
              weekProfit: data?.week.profit ?? 0,
              todaySales: data?.today.sales ?? 0,
              todayProfit: data?.today.profit ?? 0,
              currentWeekKey: data?.currentWeekKey ?? "",
              lastWeekSales: data?.lastWeek.sales,
              lastWeekProfit: data?.lastWeek.profit,
            }}
          />

          <PerformanceOverview
            week={{
              sales: data?.week.sales ?? 0,
              profit: data?.week.profit ?? 0,
              returned: data?.week.returned ?? 0,
              marketing: data?.week.marketing ?? 0,
              netProfit: data?.week.netProfit ?? 0,
              salesChange: weekSalesPct,
              profitChange: weekProfitPct,
            }}
            lastWeek={{
              sales: data?.lastWeek.sales ?? 0,
              profit: data?.lastWeek.profit ?? 0,
              returned: data?.lastWeek.returned ?? 0,
              marketing: data?.lastWeek.marketing ?? 0,
              netProfit: data?.lastWeek.netProfit ?? 0,
              payments: data?.lastWeek.payments,
              due: data?.lastWeek.due,
            }}
            month={{
              sales: data?.month.sales ?? 0,
              profit: data?.month.profit ?? 0,
              returned: data?.month.returned ?? 0,
              marketing: data?.month.marketing ?? 0,
              netProfit: data?.month.netProfit ?? 0,
              payments: data?.month.payments,
            }}
            year={{
              sales: data?.total.sales ?? 0,
              profit: data?.total.profit ?? 0,
              returned: data?.total.returned ?? 0,
              marketing: data?.total.marketing ?? 0,
              netProfit: data?.total.netProfit ?? 0,
              payments: data?.total.payments,
            }}
          />
          {weeklyChartData && weeklyChartData.length > 0 && (
            <WeeklyTrend weeks={weeklyChartData} />
          )}
        </ScrollView>
      )}
    </View>
  );
}
