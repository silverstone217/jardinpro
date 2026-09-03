import React from "react";
import { StyleSheet, Text, View } from "react-native";

const EmployeeAssignmentModal = () => {
  return (
    <View style={styles.safeArea}>
      <Text>EmployeeAssignmentModal</Text>
    </View>
  );
};

export default EmployeeAssignmentModal;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: "center",
  },
});
