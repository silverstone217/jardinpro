import { useUserStore } from "@/store/userStore";
import { Redirect, Stack } from "expo-router";
import React from "react";

const AuthLayout = () => {
  const user = useUserStore((u) => u.user);

  if (user) {
    return <Redirect href={"/(main)"} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
};

export default AuthLayout;
