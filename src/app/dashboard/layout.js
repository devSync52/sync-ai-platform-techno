import Sidebar from '@/components/sidebar';
import React from 'react'
import SynCBotButton from './components/SynCBotButton';

export default function DashboardLayout({ children }) {
    return (
        <div className="flex h-screen overflow-hidden bg-[#fbfafc] text-[#171321]">
            <Sidebar />
            <main className="relative flex min-w-0 flex-1 flex-col overflow-auto">
                <div className='w-full max-w-[1400px] mx-auto'>
                    {children}
                </div>
                <SynCBotButton />
            </main>
        </div>
    )
}
