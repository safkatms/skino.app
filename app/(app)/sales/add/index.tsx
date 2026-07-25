import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/api-error";
import { useWeeks } from "@/hooks/use-weeks";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { WeekPicker } from "@/components/ui/WeekPicker";
import { colors } from "@/components/ui/theme";
import { enqueue } from "@/lib/offline-queue";
import NetInfo from "@react-native-community/netinfo";

type Tab = "sale" | "payment" | "return";

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: "sale", label: "Sale", color: colors.indigo[600] },
  { id: "payment", label: "Payment", color: colors.green[600] },
  { id: "return", label: "Return", color: colors.orange[500] },
];

const HERO = {
  sale: {
    bg: colors.indigo[600],
    label: "New Order Sale",
    sub: "Recorded against the current open week",
  },
  payment: {
    bg: colors.green[600],
    label: "Payment Remittance",
    sub: "Apply a collected payment to a week's balance",
  },
  return: {
    bg: colors.orange[500],
    label: "Return Adjustment",
    sub: "Correct the return value for a specific week",
  },
};

export default function AddSalesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("sale");
  const [amount, setAmount] = useState("");
  const [weekKey, setWeekKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const { data: weekKeys = [] } = useWeeks();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    setErrorMsg("");
  };

  const addSale = useMutation({
    mutationFn: (amt: number) => api.post("/sales/sale", { amount: amt }),
    onSuccess: () => {
      invalidate();
      setSuccessMsg("✓ Sale recorded successfully!");
      setAmount("");
    },
    onError: (e) => setErrorMsg(getApiErrorMessage(e)),
  });

  const addPayment = useMutation({
    mutationFn: (d: { amount: number; weekKey?: string }) =>
      api.post("/sales/payment", d),
    onSuccess: () => {
      invalidate();
      setSuccessMsg("✓ Remittance successfully applied!");
      setAmount("");
      setWeekKey("");
    },
    onError: (e) => setErrorMsg(getApiErrorMessage(e)),
  });

  const addReturn = useMutation({
    mutationFn: (d: { amount: number; weekKey?: string }) =>
      api.post("/sales/return", d),
    onSuccess: () => {
      invalidate();
      setSuccessMsg("✓ Returns verified and calculated!");
      setAmount("");
      setWeekKey("");
    },
    onError: (e) => setErrorMsg(getApiErrorMessage(e)),
  });

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setErrorMsg("Enter a valid amount");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");

    const state = await NetInfo.fetch();
    const wk = weekKey || undefined;

    if (!state.isConnected) {
      await enqueue({ type: tab, amount: amt, weekKey: wk });
      setSuccessMsg("✓ Saved offline — will sync when connected.");
      setAmount("");
      setWeekKey("");
      return;
    }

    if (tab === "sale") addSale.mutate(amt);
    else if (tab === "payment") addPayment.mutate({ amount: amt, weekKey: wk });
    else addReturn.mutate({ amount: amt, weekKey: wk });
  };

  const isPending =
    addSale.isPending || addPayment.isPending || addReturn.isPending;
  const hero = HERO[tab];

  const switchTab = (id: Tab) => {
    setTab(id);
    setAmount("");
    setWeekKey("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const btnColor =
    tab === "sale"
      ? colors.indigo[600]
      : tab === "payment"
        ? colors.green[600]
        : colors.orange[500];
  const btnLabel =
    tab === "sale"
      ? "Add Sale"
      : tab === "payment"
        ? "Record Payment"
        : "Apply Correction";

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Page header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Entry</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={[styles.hero, { backgroundColor: hero.bg }]}>
            <Text style={styles.heroEyebrow}>Sales Intake</Text>
            <Text style={styles.heroTitle}>{hero.label}</Text>
            <Text style={styles.heroSub}>{hero.sub}</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            {TABS.map(({ id, label, color }) => (
              <TouchableOpacity
                key={id}
                style={[
                  styles.tabItem,
                  tab === id ? styles.tabItemActive : null,
                ]}
                onPress={() => switchTab(id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    tab === id ? { color } : styles.tabLabelInactive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Alerts */}
          {errorMsg ? <Alert message={errorMsg} type="error" /> : null}
          {successMsg ? <Alert message={successMsg} type="success" /> : null}

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.form}>
              <Input
                label={
                  tab === "payment"
                    ? "Amount Received (BDT)"
                    : tab === "return"
                      ? "Adjustment Value (BDT)"
                      : "Amount (BDT)"
                }
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              {(tab === "payment" || tab === "return") && (
                <WeekPicker
                  label="Target Week"
                  weekKeys={weekKeys}
                  value={weekKey}
                  onChange={setWeekKey}
                />
              )}
              <Button
                onPress={handleSubmit}
                loading={isPending}
                color={btnColor}
              >
                {btnLabel}
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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

  hero: { borderRadius: 20, padding: 20, gap: 4 },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 },

  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  tabItemActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: { fontSize: 13, fontWeight: "700" },
  tabLabelInactive: { color: colors.gray[400] },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  form: { gap: 16 },
});
