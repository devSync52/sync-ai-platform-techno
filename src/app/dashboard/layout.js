"use client";
import Sidebar from '@/components/sidebar';
import React, { useState } from 'react'
import SynCBotButton from './components/SynCBotButton';
import IconAsset from '@/components/IconAsset';

export default function DashboardLayout({ children }) {
    const [compressed, setCompressed] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(103,0,231,0.08),transparent_32%),linear-gradient(135deg,#fbfafc_0%,#f6f2fb_46%,#fdfcff_100%)] text-[#171321]">
            <Sidebar compressed={compressed} setCompressed={setCompressed} />
            <main className="relative flex min-w-0 flex-1 flex-col overflow-auto w-full">
                <div className='sticky top-0 z-9 block lg:hidden bg-[#110923] text-[#b9aecb]'>
                    <div className='flex h-16 items-center gap-3 border-b border-white/10 px-4'>

                        <button onClick={()=> setCompressed(!compressed)} className="flex items-center justify-center rounded-lg transition-all duration-200 text-[#9b8cb8] hover:scale-105 hover:text-white hover:bg-[#1e1631] h-8 w-8">
                            <IconAsset name="sidebar" className="h-5 w-5" />
                        </button>

                        <IconAsset name="bot" className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                            <div className="text-md font-semibold leading-4 text-white mb-1">SynC AI</div>
                            <div className="text-xs leading-4 text-[#837596]">Courier Management</div>
                        </div>

                    </div>
                </div>
                <div className='w-full max-w-[1400px] mx-auto pb-32'>
                    {children}
                </div>
                <SynCBotButton />
            </main>
        </div>
    )
}
