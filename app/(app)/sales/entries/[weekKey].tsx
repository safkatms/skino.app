import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/axios";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/api-error";
import { colors } from "@/components/ui/theme";
import Feather from "@expo/vector-icons/Feather";
interface SalesEntry {
  id: number;
  type: "SALE" | "PAYMENT" | "RETURN";
  amount: number;
  entryDate: string;
  note: string | null;
  weekKey: string;
}

const fmt = (v: number) =>
  `৳${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const TYPE_COLOR: Record<string, string> = {
  SALE: colors.indigo[600],
  PAYMENT: colors.green[600],
  RETURN: colors.orange[500],
  MARKETING: "#A855F7",
};
const TYPE_BG: Record<string, string> = {
  SALE: colors.indigo[50],
  PAYMENT: colors.green[50],
  RETURN: "#FFF7ED",
  MARKETING: "#F5F3FF",
};
const TYPE_LABEL: Record<string, string> = {
  SALE: "Sale",
  PAYMENT: "Payment",
  RETURN: "Return",
  MARKETING: "Marketing",
};
const TYPE_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  SALE: "trending-up",
  PAYMENT: "check-circle",
  RETURN: "corner-down-left",
  MARKETING: "zap",
};

function EditModal({
  entry,
  onClose,
  onSave,
  saving,
}: {
  entry: SalesEntry;
  onClose: () => void;
  onSave: (id: number, amount: number) => void;
  saving: boolean;
}) {
  const [value, setValue] = useState(String(entry.amount));
  const accent = TYPE_COLOR[entry.type];

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          style={{ width: "100%" }}
        >
        <View style={modal.sheet}>
          {/* Sheet handle */}
          <View style={modal.handle} />

          <View style={modal.header}>
            <View>
              <Text style={modal.title}>Edit Entry</Text>
              <Text style={modal.subtitle}>
                {TYPE_LABEL[entry.type]} · {fmtDate(entry.entryDate)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={8}
              style={modal.closeBtn}
            >
              <Feather name="x" size={18} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          {/* Amount field */}
          <View style={modal.fieldWrap}>
            <Text style={modal.currencyLabel}>BDT</Text>
            <TextInput
              style={[modal.input, { borderColor: accent }]}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              autoFocus
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          <View style={modal.actions}>
            <TouchableOpacity
              style={modal.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.saveBtn, { backgroundColor: accent }]}
              onPress={() => onSave(entry.id, parseFloat(value))}
              activeOpacity={0.7}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="check" size={15} color="#fff" />
                  <Text style={modal.saveText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function WeekEntriesScreen() {
  const { weekKey } = useLocalSearchParams<{ weekKey: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [editEntry, setEditEntry] = useState<SalesEntry | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"daily" | "entries">("daily");

  const {
    data: entries,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sales", "entries", weekKey],
    queryFn: async () => {
      const res = await api.get<{ data: SalesEntry[] }>(
        `/sales/entries?weekKey=${weekKey}`,
      );
      return res.data.data;
    },
  });
  const { data: dailySales } = useQuery({
    queryKey: ["sales", "daily", weekKey],
    queryFn: async () => {
      const res = await api.get<{
        data: { date: string; sales: number; profit: number }[];
      }>(`/sales/entries/daily?weekKey=${weekKey}`);
      return res.data.data;
    },
  });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sales", "entries", weekKey] });
    queryClient.invalidateQueries({ queryKey: ["sales", "summary", "weekly"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      api.patch(`/sales/${id}`, { amount }),
    onSuccess: () => {
      invalidate();
      setEditEntry(null);
    },
    onError: (e) => setErrorMsg(getApiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/sales/${id}`),
    onSuccess: () => {
      invalidate();
      setDeletingId(null);
    },
    onError: (e) => {
      setDeletingId(null);
      setErrorMsg(getApiErrorMessage(e));
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const count = entries?.length ?? 0;

  return (
    <View style={[styles.root]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: 64 + insets.top },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{weekKey}</Text>
          <Text style={styles.headerSub}>
            {count} {count === 1 ? "entry" : "entries"}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
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
          {/* Tab switcher */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === "daily" && styles.tabItemActive,
              ]}
              onPress={() => setActiveTab("daily")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === "daily" && styles.tabLabelActive,
                ]}
              >
                Daily Breakdown
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === "entries" && styles.tabItemActive,
              ]}
              onPress={() => setActiveTab("entries")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === "entries" && styles.tabLabelActive,
                ]}
              >
                Entries
              </Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? <Alert message={errorMsg} /> : null}

          {activeTab === "daily" ? (
            dailySales && dailySales.length > 0 ? (
              <>
                {/* Week totals card */}
                {(() => {
                  const totalSales = dailySales.reduce(
                    (s, d) => s + d.sales,
                    0,
                  );
                  const totalProfit = dailySales.reduce(
                    (s, d) => s + d.profit,
                    0,
                  );
                  const n = dailySales.length;
                  return (
                    <View style={styles.totalsCard}>
                      <View style={styles.totalItem}>
                        <Text style={styles.totalItemLabel}>Sales</Text>
                        <Text style={styles.totalItemValue}>
                          {fmt(totalSales)}
                        </Text>
                        <Text style={styles.totalItemSub}>
                          avg {fmt(totalSales / n)}
                        </Text>
                      </View>
                      <View style={styles.totalDivider} />
                      <View style={styles.totalItem}>
                        <Text style={styles.totalItemLabel}>Profit</Text>
                        <Text
                          style={[
                            styles.totalItemValue,
                            { color: colors.green[600] },
                          ]}
                        >
                          {fmt(totalProfit)}
                        </Text>
                        <Text
                          style={[
                            styles.totalItemSub,
                            { color: colors.green[500] },
                          ]}
                        >
                          avg {fmt(totalProfit / n)}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                <View style={styles.dailySection}>
                  <Text style={styles.sectionTitle}>Daily Breakdown</Text>
                  {(() => {
                    const bestIdx = dailySales.reduce(
                      (bi, d, i) => (d.sales > dailySales[bi].sales ? i : bi),
                      0,
                    );
                    return dailySales.map((d, i) => (
                      <View key={d.date} style={styles.dailyRow}>
                        <View style={styles.dailyLeft}>
                          <Text style={styles.dailyDate}>
                            {new Date(d.date + "T00:00:00Z").toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </Text>
                          {i === bestIdx && (
                            <View style={styles.bestBadge}>
                              <Text style={styles.bestBadgeText}>Best Day</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.dailyRight}>
                          <Text style={styles.dailySales}>{fmt(d.sales)}</Text>
                          <Text style={styles.dailyProfit}>
                            +{fmt(d.profit)} profit
                          </Text>
                        </View>
                      </View>
                    ));
                  })()}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyTitle}>No sales this week</Text>
                <Text style={styles.emptyBody}>
                  Daily sales breakdown will appear here.
                </Text>
              </View>
            )
          ) : !entries?.length ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptyBody}>
                Sales, payments, returns and marketing activities for this week
                will appear here.
              </Text>
            </View>
          ) : (
            entries.map((entry) => {
              const accent = TYPE_COLOR[entry.type];
              const bg = TYPE_BG[entry.type];
              const isDeleting = deletingId === entry.id;
              return (
                <View key={entry.id} style={styles.entryCard}>
                  {/* Top row: icon+type left, amount right */}
                  <View style={styles.entryTop}>
                    <View style={styles.entryTypeRow}>
                      <View
                        style={[styles.entryIconCircle, { backgroundColor: bg }]}
                      >
                        <Feather
                          name={TYPE_ICON[entry.type]}
                          size={15}
                          color={accent}
                        />
                      </View>
                      <View>
                        <Text style={[styles.entryTypeLabel, { color: accent }]}>
                          {TYPE_LABEL[entry.type]}
                        </Text>
                        <Text style={styles.entryDate}>
                          {fmtDate(entry.entryDate)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.entryAmount, { color: accent }]}>
                      {fmt(entry.amount)}
                    </Text>
                  </View>

                  {/* Note */}
                  {entry.note ? (
                    <Text style={styles.entryNote}>{entry.note}</Text>
                  ) : null}

                  {/* Divider + actions */}
                  <View style={styles.entryFooter}>
                    <TouchableOpacity
                      onPress={() => setEditEntry(entry)}
                      hitSlop={8}
                      style={styles.entryActionBtn}
                    >
                      <Feather name="edit-2" size={13} color={colors.gray[400]} />
                      <Text style={styles.entryActionLabel}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setDeletingId(entry.id);
                        deleteMutation.mutate(entry.id);
                      }}
                      hitSlop={8}
                      disabled={isDeleting}
                      style={styles.entryActionBtn}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color={colors.red[400]} />
                      ) : (
                        <>
                          <Feather name="trash-2" size={13} color={colors.red[400]} />
                          <Text style={styles.entryActionLabelDanger}>Delete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {editEntry && (
        <EditModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSave={(id, amount) => updateMutation.mutate({ id, amount })}
          saving={updateMutation.isPending}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.gray[50] },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.gray[50],
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 15, fontWeight: "800", color: colors.gray[900] },
  headerSub: { fontSize: 11, color: colors.gray[400], marginTop: 1 },

  scrollContent: { padding: 16, gap: 10, paddingBottom: 40 },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIcon: { fontSize: 36, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray[700] },
  emptyBody: {
    fontSize: 13,
    color: colors.gray[400],
    textAlign: "center",
    lineHeight: 19,
  },

  // Entry card
  entryCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  entryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  entryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  entryTypeLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  entryDate: { fontSize: 11, color: colors.gray[400], marginTop: 1 },
  entryAmount: { fontSize: 18, fontWeight: "800" },
  entryNote: {
    fontSize: 12,
    color: colors.gray[500],
    fontStyle: "italic",
    paddingHorizontal: 2,
  },
  entryFooter: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[50],
  },
  entryActionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  entryActionLabel: { fontSize: 12, fontWeight: "600", color: colors.gray[400] },
  entryActionLabelDanger: { fontSize: 12, fontWeight: "600", color: colors.red[400] },
  dailySection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 16,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  dailyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  dailyDate: { fontSize: 13, color: colors.gray[700], fontWeight: "600" },
  dailyRight: { alignItems: "flex-end", gap: 2 },
  dailySales: { fontSize: 13, fontWeight: "800", color: colors.gray[900] },
  dailyProfit: { fontSize: 11, color: colors.green[600], fontWeight: "600" },
  // Totals card
  totalsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    flexDirection: "row",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  totalItem: { flex: 1, alignItems: "center", gap: 4 },
  totalItemLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.gray[500],
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  totalItemValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.gray[900],
  },
  totalItemSub: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.gray[400],
  },
  totalDivider: {
    width: 1,
    backgroundColor: colors.gray[100],
    marginVertical: 4,
  },

  // Daily left col (date + badge)
  dailyLeft: { gap: 4 },
  bestBadge: {
    backgroundColor: colors.indigo[50],
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  bestBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.indigo[600],
  },

  avgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: colors.gray[200],
    borderStyle: "dashed",
  },
  avgLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.indigo[600],
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  avgSales: { fontSize: 13, fontWeight: "800", color: colors.indigo[600] },
  avgProfit: { fontSize: 11, color: colors.green[600], fontWeight: "600" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: colors.indigo[600],
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.gray[400],
  },
  tabLabelActive: {
    color: "#fff",
  },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
    gap: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[200],
    alignSelf: "center",
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.gray[900] },
  subtitle: { fontSize: 12, color: colors.gray[400], marginTop: 3 },

  fieldWrap: { gap: 8 },
  currencyLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: "800",
    color: colors.gray[900],
    backgroundColor: colors.gray[50],
  },

  actions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.gray[50],
  },
  cancelText: { fontSize: 14, fontWeight: "700", color: colors.gray[500] },
  saveBtn: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  saveText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
