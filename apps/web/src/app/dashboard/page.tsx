"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getUserProfile, signOut } from "@/lib/auth";
import { supabase } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";
import type { UserProfile, UserCredits } from "@aimediaos/shared";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/signin");
        return;
      }

      setUser(currentUser);

      // Load profile
      const userProfile = await getUserProfile(currentUser.id);
      setProfile(userProfile);

      // Load credits
      const { data: creditData } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (creditData) {
        setCredits(creditData as UserCredits);
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Credits Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Credits</h2>
          {credits ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-3xl font-bold text-blue-600">{credits.balance}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Used This Month</p>
                <p className="text-3xl font-bold">{credits.lifetimeUsed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lifetime Purchased</p>
                <p className="text-3xl font-bold">{credits.lifetimePurchased}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Loading...</p>
          )}
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Buy More Credits
          </button>
        </div>

        {/* Account Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="font-medium capitalize">{profile?.subscriptionTier || "Free"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <button className="mt-4 px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors">
            Edit Profile
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-600 text-sm">Your recent generations will appear here.</p>
        </div>
      </main>
    </div>
  );
}
