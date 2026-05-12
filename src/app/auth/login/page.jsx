"use client";

// import "@/styles/daypicker-custom.css";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from "@/components/ui/button";

import { Bot, Car, Check, CircleCheck, CircleX, Clock, Download, Plus, RefreshCcw, ShieldAlert, SquarePen, Trash } from 'lucide-react';


export default function LoginPage() {


    return (
        <div className="min-h-screen bg-[#0d0033] flex items-center justify-center">
            <div className="w-[420px] h-[380px] bg-[#f3f3f3] rounded-2xl shadow-2xl flex flex-col items-center justify-between py-10 px-8">

                {/* Robot Icon */}
                <div className="flex-1 flex items-start justify-center pt-6">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
                        alt="robot"
                        className="w-16 h-16"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                </div>

                {/* Button */}
                <button className="w-full bg-gradient-to-r from-purple-700 to-violet-600 hover:opacity-90 transition-all text-white font-semibold py-3 rounded-lg shadow-lg cursor-pointer">
                    Sign in to SynC AI
                </button>
            </div>
        </div>
    );
}
