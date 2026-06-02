import Sidebar from '@/components/sidebar';
import React from 'react'
import SynCBotButton from './components/SynCBotButton';

export default function DashboardLayout({ children }) {
    return (
        <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(103,0,231,0.08),transparent_32%),linear-gradient(135deg,#fbfafc_0%,#f6f2fb_46%,#fdfcff_100%)] text-[#171321]">
            <Sidebar />
            <main className="relative flex min-w-0 flex-1 flex-col overflow-auto">
                <div className='w-full max-w-[1400px] mx-auto pb-32'>
                    {children}
                </div>
                <SynCBotButton />
            </main>
        </div>
    )
}
