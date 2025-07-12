"use client"

import { Suspense } from "react";
import AuthCompleteInner from "./AuthCompleteInner";

export default function AuthCompletePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCompleteInner />
    </Suspense>
  );
} 