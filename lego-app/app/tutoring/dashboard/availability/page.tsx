"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";
import Link from "next/link";

export default function EditAvailabilityPage() {
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadAvailability() {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          redirect("/sign-in");
          return;
        }

        const response = await fetch(`/api/tutor-availability?tutorId=${user.id}`);
        const data = await response.json();
        setAvailability(data.availability || []);
      } catch (error) {
        console.error("Error loading availability:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/set-availability", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        redirect("/tutoring/dashboard");
      } else {
        alert("Failed to save availability");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  // Group availability by day of week
  const availabilityByDay: Record<number, any[]> = {};
  availability.forEach((slot: any) => {
    if (!availabilityByDay[slot.dayOfWeek]) {
      availabilityByDay[slot.dayOfWeek] = [];
    }
    availabilityByDay[slot.dayOfWeek].push(slot);
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-blue-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-6">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/tutoring/dashboard" className="text-gray-500 hover:text-gray-700">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">
              Edit Availability
            </h1>
          </div>
          <p className="font-body-md text-on-surface-variant">
            Set your weekly availability for tutoring sessions. Learners can book sessions during these time slots.
          </p>
        </div>
      </div>

      {/* Availability Form */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, idx) => (
            <div key={day} className="rounded-2xl bg-white p-6 shadow-xl border-4 border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-md text-headline-md text-on-surface font-extrabold">
                  {day}
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={`day_${idx}_enabled`}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    defaultChecked={availabilityByDay[idx]?.length > 0}
                    onChange={(e) => {
                      const container = e.target.closest('.rounded-2xl');
                      const slotsContainer = container?.querySelector('.slots-container');
                      if (slotsContainer) {
                        (slotsContainer as HTMLElement).style.display = e.target.checked ? 'block' : 'none';
                      }
                    }}
                  />
                  <span className="font-label-sm font-semibold text-on-surface">Available</span>
                </label>
              </div>

              <div className={`slots-container ${availabilityByDay[idx]?.length === 0 ? 'hidden' : ''}`}>
                {availabilityByDay[idx]?.map((slot: any, slotIdx: number) => (
                  <div key={slot.id} className="flex gap-3 mb-3">
                    <div className="flex-1">
                      <label className="block font-label-sm font-semibold mb-1 text-on-surface">
                        Start Time
                      </label>
                      <input
                        type="time"
                        name={`day_${idx}_slot_${slotIdx}_start`}
                        defaultValue={slot.startTime}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block font-label-sm font-semibold mb-1 text-on-surface">
                        End Time
                      </label>
                      <input
                        type="time"
                        name={`day_${idx}_slot_${slotIdx}_end`}
                        defaultValue={slot.endTime}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}

                {availabilityByDay[idx]?.length === 0 && (
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1">
                      <label className="block font-label-sm font-semibold mb-1 text-on-surface">
                        Start Time
                      </label>
                      <input
                        type="time"
                        name={`day_${idx}_slot_0_start`}
                        defaultValue="09:00"
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block font-label-sm font-semibold mb-1 text-on-surface">
                        End Time
                      </label>
                      <input
                        type="time"
                        name={`day_${idx}_slot_0_end`}
                        defaultValue="17:00"
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Link
              href="/tutoring/dashboard"
              className="flex-1 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-600 px-4 py-3 font-label-md font-semibold hover:bg-gray-100 transition-all text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 font-label-md font-bold shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Availability"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
