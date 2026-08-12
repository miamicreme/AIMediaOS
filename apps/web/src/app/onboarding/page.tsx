"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

export default function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/signin");
        return;
      }
      setUser(currentUser);
    };

    checkAuth();
  }, [router]);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      router.push("/dashboard");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of 4</span>
            <span className="text-sm text-gray-600">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Welcome to AIMediaOS!</h1>
            <p className="text-gray-600 mb-6">Let's get you set up to start creating with AI.</p>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">✨ Free Trial</h3>
                <p className="text-sm text-gray-700">You get 10 free generations this month. No credit card required.</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🚀 Multiple Workflows</h3>
                <p className="text-sm text-gray-700">Create images, edit photos, swap clothes, and generate videos.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Choose Plan */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Choose Your Plan</h2>
            <div className="space-y-4">
              <div className="border-2 border-blue-600 rounded-lg p-4 bg-blue-50">
                <h3 className="font-bold mb-2">Free (Current)</h3>
                <p className="text-sm text-gray-700 mb-3">10 generations per month</p>
                <button className="text-sm text-blue-600 font-medium">Current Plan</button>
              </div>
              <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors cursor-pointer">
                <h3 className="font-bold mb-2">Pro Monthly</h3>
                <p className="text-sm text-gray-700 mb-3">Unlimited generations - $9.99/month</p>
                <button className="text-sm text-blue-600 font-medium hover:underline">Learn More</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Preferences</h2>
            <div className="space-y-4">
              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="ml-3">Email me about new features</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="ml-3">Get weekly usage reports</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="ml-3">Help us improve (share feedback)</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Ready */}
        {step === 4 && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">You're All Set! 🎉</h2>
            <p className="text-gray-600 mb-6">Your account is ready. Let's create something amazing.</p>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Email</p>
              <p className="font-semibold">{user.email}</p>
            </div>
            <p className="text-sm text-gray-600">You can always change settings later in your dashboard.</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {step === 4 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
