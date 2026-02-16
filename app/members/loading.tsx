import React from 'react'

export default function Loading() {
    return (
        <div className="min-h-screen relative font-sans text-white overflow-x-hidden pb-32 bg-[#0B0B0D]">
            {/* Background: First frame image (mobile) + dark fallback (desktop) */}
            <div className="fixed inset-0 z-[-2] bg-[#0B0B0D]">
                <img
                    src="/members-bg/IllaMembers-mobile_001.webp"
                    alt=""
                    className="w-full h-full object-cover opacity-40 md:hidden"
                    loading="eager"
                    fetchPriority="high"
                />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-6 pb-20">
                <div className="flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-10">

                    {/* LEFT COLUMN SKELETON */}
                    <div className="md:col-span-5 lg:col-span-4 relative">
                        <div className="md:sticky md:top-8 space-y-6">
                            {/* Profile Card Skeleton */}
                            <div className="rounded-3xl bg-white/5 p-6 border border-white/5 h-[400px] animate-pulse relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                                <div className="flex flex-col items-center gap-4 mt-8">
                                    <div className="w-24 h-24 rounded-full bg-white/10" />
                                    <div className="w-3/4 h-8 bg-white/10 rounded-lg" />
                                    <div className="w-1/2 h-4 bg-white/5 rounded-lg" />
                                </div>
                                <div className="mt-8 space-y-3">
                                    <div className="w-full h-12 bg-white/5 rounded-xl" />
                                    <div className="w-full h-12 bg-white/5 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN SKELETON */}
                    <div className="md:col-span-7 lg:col-span-8 space-y-6">
                        {/* Daily Missions Skeleton */}
                        <div className="rounded-3xl bg-white/5 p-6 border border-white/5 h-48 animate-pulse" />

                        {/* Secondary Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-3xl bg-white/5 p-6 border border-white/5 h-64 animate-pulse" />
                            <div className="rounded-3xl bg-white/5 p-6 border border-white/5 h-64 animate-pulse" />
                        </div>

                        {/* Wide Modules */}
                        <div className="space-y-6">
                            <div className="rounded-3xl bg-white/5 p-6 border border-white/5 h-32 animate-pulse" />
                            <div className="rounded-3xl bg-white/5 p-6 border border-white/5 h-80 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
