import React from "react";
import {
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Employee } from "@/types/employees";
import { COLORS, fonts } from "@/utils/styles";

type EmployeeCardProps = {
  employee: Employee;
  onPress: (employee: Employee) => void;
  onMorePress: (employee: Employee) => void;
};

const getInitials = (name: string) => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const EmployeeCard = ({
  employee,
  onPress,
  onMorePress,
}: EmployeeCardProps) => {
  const handlePress = () => {
    Keyboard.dismiss();
    onPress(employee);
  };

  const handleMorePress = () => {
    Keyboard.dismiss();
    onMorePress(employee);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.employeeCard,
        employee.isBanned && styles.employeeCardBanned,
        pressed && styles.pressed,
      ]}
    >
      {/* TOP */}
      <View style={styles.employeeTop}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {employee.image ? (
            <Image source={{ uri: employee.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {getInitials(employee.name)}
              </Text>
            </View>
          )}
        </View>

        {/* Informations */}
        <View style={styles.employeeInfo}>
          <Text
            style={[
              styles.employeeName,
              employee.isBanned && styles.employeeNameBanned,
            ]}
            numberOfLines={1}
          >
            {employee.name}
          </Text>

          <View style={styles.telephoneRow}>
            <MaterialCommunityIcons
              name="phone-outline"
              size={13}
              color={COLORS.Gray}
            />

            <Text style={styles.employeeTelephone}>{employee.telephone}</Text>
          </View>
        </View>

        {/* Actions */}
        <Pressable
          hitSlop={8}
          onPress={handleMorePress}
          style={({ pressed }) => [
            styles.moreButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={21}
            color={COLORS.darkGray}
          />
        </Pressable>
      </View>

      {/* META */}
      <View style={styles.employeeBottom}>
        {/* Statut */}
        <View
          style={[
            styles.statusBadge,
            employee.isBanned
              ? styles.statusBadgeBanned
              : styles.statusBadgeActive,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: employee.isBanned
                  ? COLORS.error
                  : COLORS.success,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: employee.isBanned ? COLORS.error : COLORS.success,
              },
            ]}
          >
            {employee.isBanned ? "Banni" : "Actif"}
          </Text>
        </View>

        {/* Affectation */}
        <View style={styles.assignmentPreview}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={14}
            color={COLORS.Gray}
          />

          <Text style={styles.assignmentText} numberOfLines={1}>
            Aucun point de vente
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default EmployeeCard;

const styles = StyleSheet.create({
  employeeCard: {
    marginBottom: 12,
    padding: 15,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#ECEDE9",
  },

  employeeCardBanned: {
    backgroundColor: "#FFF9F9",
    borderColor: "#F3DADA",
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },

  employeeTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 15,
    overflow: "hidden",
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F2E5",
  },

  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: COLORS.primary,
  },

  employeeInfo: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  employeeName: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: COLORS.text,
  },

  employeeNameBanned: {
    color: COLORS.darkGray,
  },

  telephoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  employeeTelephone: {
    marginLeft: 5,
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: COLORS.Gray,
  },

  moreButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    borderRadius: 11,
    backgroundColor: COLORS.background,
  },

  employeeBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0ED",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  statusBadgeActive: {
    backgroundColor: "#EDF7EC",
  },

  statusBadgeBanned: {
    backgroundColor: "#FDECEC",
  },

  statusDot: {
    width: 6,
    height: 6,
    marginRight: 5,
    borderRadius: 3,
  },

  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
  },

  assignmentPreview: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    minWidth: 0,
  },

  assignmentText: {
    flex: 1,
    marginLeft: 5,
    fontFamily: fonts.regular,
    fontSize: 9.5,
    color: COLORS.Gray,
  },
});
