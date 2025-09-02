"use client";

import { Suspense } from "react";
import CoursesPageContent from "./components/CoursesPageContent ";

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading courses...</p>
      </div>
    }>
      <CoursesPageContent />
    </Suspense>
  );
}
