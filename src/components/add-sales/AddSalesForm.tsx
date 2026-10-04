import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { WeekPicker } from "@/components/ui/WeekPicker";
import { Alert } from "@/components/ui/Alert";
import { colors } from "@/components/ui/theme";
import { TAB_CONFIG, type Tab } from "./AddSalesTabBar";

interface AddSalesFormProps {
  tab: Tab;
  amount: string;
  weekKey: string;
  weekKeys: string[];
  lastWeekKey: string;
  isPending: boolean;
  errorMsg: string;
  successMsg: string;
  onAmountChange: (value: string) => void;
  onWeekChange: (value: string) => void;
  onSubmit: () => void;
  evalAmount: (expression: string) => number;
}

export function AddSalesForm({
  tab,
  amount,
  weekKey,
  weekKeys,
  lastWeekKey,
  isPending,
  errorMsg,
  successMsg,
  onAmountChange,
  onWeekChange,
  onSubmit,
  evalAmount,
}: AddSalesFormProps) {
  const config = TAB_CONFIG.find((item) => item.id === tab)!;
  const isSale = tab === "sale";
  const showWeekPicker = !isSale;
  const total = evalAmount(amount);

  const amountLabel = {
    sale: "Amount (BDT)",
    payment: "Amount Received (BDT)",
    return: "Adjustment Value (BDT)",
    marketing: "Marketing Cost (BDT)",
  }[tab];

  const hint = {
    sale: "This sale will be recorded in the current open week",
    payment: "Payment will be applied to the selected week's balance",
    return: "Return amount will adjust the selected week's total",
    marketing:
      "Marketing cost will be deducted from the selected week's profit",
  }[tab];

  const buttonLabel = {
    sale: "Add Sale",
    payment: "Record Payment",
    return: "Apply Correction",
    marketing: "Log Expense",
  }[tab];

  return (
    <View style={styles.container}>
      {errorMsg ? <Alert message={errorMsg} type="error" /> : null}

      {successMsg ? <Alert message={successMsg} type="success" /> : null}

      <Text style={styles.inputLabel}>{amountLabel}</Text>

      {/* Amount */}
      <View style={[styles.inputRow, { borderColor: `${config.color}60` }]}>
        <View
          style={[styles.prefix, { borderRightColor: `${config.color}30` }]}
        >
          <Text style={[styles.prefixText, { color: config.color }]}>৳</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor={colors.gray[300]}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={onAmountChange}
        />

        {isSale && (
          <TouchableOpacity
            style={[styles.addButton, { borderLeftColor: `${config.color}30` }]}
            onPress={() => onAmountChange(`${amount}+`)}
            activeOpacity={0.7}
          >
            <Text style={[styles.addButtonText, { color: config.color }]}>
              +
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Expression total */}
      {isSale && amount.includes("+") && total > 0 && (
        <Text style={[styles.expressionTotal, { color: config.color }]}>
          = ৳ {total.toLocaleString("en-BD")}
        </Text>
      )}

      {/* Target week */}
      {showWeekPicker && (
        <WeekPicker
          label="Target Week"
          weekKeys={weekKeys}
          value={weekKey || lastWeekKey}
          onChange={onWeekChange}
        />
      )}

      {/* Hint */}
      <View style={styles.hint}>
        <Feather name="info" size={13} color={colors.gray[400]} />

        <Text style={styles.hintText}>{hint}</Text>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: config.color }]}
        onPress={onSubmit}
        activeOpacity={0.85}
        disabled={isPending}
      >
        <Text style={styles.submitLabel}>{buttonLabel}</Text>

        <View style={styles.submitArrow}>
          <Feather name="arrow-right" size={17} color={config.color} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 20,
    gap: 14,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.gray[700],
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: colors.gray[50],
    overflow: "hidden",
  },

  prefix: {
    width: 46,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
  },

  prefixText: {
    fontSize: 20,
    fontWeight: "700",
  },

  input: {
    flex: 1,
    height: 54,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray[900],
  },

  addButton: {
    width: 46,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
  },

  addButtonText: {
    fontSize: 24,
    fontWeight: "700",
  },

  expressionTotal: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    marginTop: -6,
  },

  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  hintText: {
    flex: 1,
    fontSize: 12,
    color: colors.gray[400],
    lineHeight: 17,
  },

  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 20,
  },

  submitLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  submitArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
