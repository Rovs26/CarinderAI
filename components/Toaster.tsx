"use client";
import { Toaster as RHTToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <RHTToaster
      position="top-center"
      toastOptions={{
        duration: 2400,
        style: {
          background: "#ffffff",
          color: "#1a1a1a",
          border: "1px solid #e5e5e5",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: 500,
        },
        success: {
          iconTheme: {
            primary: "#ea580c",
            secondary: "#ffffff",
          },
        },
        error: {
          style: {
            background: "#ffffff",
            color: "#ef4444",
            border: "1px solid #e5e5e5",
          },
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}
