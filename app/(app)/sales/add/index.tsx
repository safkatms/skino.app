import React, { useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/api-error";
import { useWeeks } from "@/hooks/use-weeks";
import { enqueue } from "@/lib/offline-queue";
import NetInfo from "@react-native-community/netinfo";
import { AddSalesTabBar, Tab } from "@/components/add-sales/AddSalesTabBar";
import { AddSalesHero } from "@/components/add-sales/AddSalesHero";
import { AddSalesForm } from "@/components/add-sales/AddSalesForm";
import { colors } from "@/components/ui/theme";

const HERO_CONFIG = {
  sale: {
    label: "New Order Sale",
    sub: "Record a new order sale for the current week",
    icon: "shopping-cart" as const,
    color: colors.indigo[600],
  },
  payment: {
    label: "Payment",
    sub: "Record a payment received for a specific week",
    icon: "credit-card" as const,
    color: colors.green[500],
  },
  return: {
    label: "Return",
    sub: "Log a return for a specific week",
    icon: "rotate-ccw" as const,
    color: colors.amber[500],
  },
  marketing: {
    label: "Marketing",
    sub: "Log marketing expenses for a specific week",
    icon: "radio" as const,
    color: colors.purple[500],
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
  const lastWeekKey = weekKeys[1] ?? weekKeys[0] ?? "";
  const activeColor = HERO_CONFIG[tab].color;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    setErrorMsg("");
  };

  const onSuccess = (msg: string) => {
    invalidate();
    setSuccessMsg(msg);
    setAmount("");
    setWeekKey("");
  };

  const addSale = useMutation({
    mutationFn: (amt: number) => api.post("/sales/sale", { amount: amt }),
    onSuccess: () => onSuccess("✓ Sale recorded successfully!"),
    onError: (e) => setErrorMsg(getApiErrorMessage(e)),
  });
  const addPayment = useMutation({
    mutationFn: (d: { amount: number; weekKey?: string }) =>
      api.post("/sales/payment", d),
    onSuccess: () => onSuccess("✓ Payment recorded successfully!"),
    onError: (e) => setErrorMsg(getApiErrorMessage(e)),
  });
  const addReturn = useMutation({
    mutationFn: (d: { amount: number; weekKey?: string }) =>
      api.post("/sales/return", d),
    onSuccess: () => onSuccess("✓ Return logged successfully!"),
    onError: (e) => setErrorMsg(getApiErrorMessage(e)),
  });
  const addMarketing = useMutation({
    mutationFn: (d: { amount: number; weekKey?: string }) =>
      api.post("/sales/marketing", d),
    onSuccess: () => onSuccess("✓ Marketing expense logged successfully!"),
    onError: (e) => setErrorMsg(getApiErrorMessage(e)),
  });

  const evalAmount = (expr: string) =>
    expr
      .split("+")
      .map((p) => parseFloat(p.trim()))
      .filter((n) => !isNaN(n))
      .reduce((a, b) => a + b, 0);

  const handleSubmit = async () => {
    const amt = evalAmount(amount);
    if (!amt || amt <= 0) {
      setErrorMsg("Enter a valid amount");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");

    const state = await NetInfo.fetch();
    const wk = weekKey || lastWeekKey;

    if (!state.isConnected) {
      await enqueue({ type: tab, amount: amt, weekKey: wk });
      setSuccessMsg("✓ Saved offline — will sync when connected.");
      setAmount("");
      setWeekKey("");
      return;
    }

    if (tab === "sale") addSale.mutate(amt);
    else if (tab === "payment") addPayment.mutate({ amount: amt, weekKey: wk });
    else if (tab === "return") addReturn.mutate({ amount: amt, weekKey: wk });
    else if (tab === "marketing")
      addMarketing.mutate({ amount: amt, weekKey: wk });
  };

  const switchTab = (id: Tab) => {
    setTab(id);
    setAmount("");
    setWeekKey("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const isPending =
    addSale.isPending ||
    addPayment.isPending ||
    addReturn.isPending ||
    addMarketing.isPending;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={s.root}>
        <View style={[s.header, { paddingTop: insets.top + 14 }]}>
          <Text style={s.headerTitle}>Add Entry</Text>
        </View>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AddSalesHero config={HERO_CONFIG[tab]} />
          <AddSalesTabBar active={tab} onChange={switchTab} />
          <AddSalesForm
            tab={tab}
            amount={amount}
            weekKey={weekKey}
            weekKeys={weekKeys}
            lastWeekKey={lastWeekKey}
            isPending={isPending}
            errorMsg={errorMsg}
            successMsg={successMsg}
            onAmountChange={setAmount}
            onWeekChange={setWeekKey}
            onSubmit={handleSubmit}
            evalAmount={evalAmount}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F5",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
});
