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
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import React from "react";


export default function OtpPage() {
    const [value, setValue] = React.useState("")

    return (
        <div className="min-h-screen bg-[#0d0033] flex flex-col items-center justify-center p-4">
            <div className="w-[500px] max-w-full bg-[#f3f3f3] rounded-2xl shadow-2xl py-10 px-8">
                <p className="text-center text-2xl font-bold mb-1">Enter Verification Code</p>
                <div className="bg-primary w-[100px] h-1 mx-auto my-4"></div>
                <p className="text-center mb-10 font-semibold">Please enter the verification code that was sent to your email address <span className="text-primary">ayan.m@technoexponent.com</span></p>
                <div className="grid grid-cols-1 gap-4 w-full mb-8">
                    <div className="w-full">
                        <div className="space-y-2">
                            <InputOTP
                                maxLength={6}
                                value={value}
                                onChange={(value) => setValue(value)}
                                className="justify-center"
                            >
                                <InputOTPGroup className="justify-center w-full gap-3">
                                    <InputOTPSlot index={0} className="w-[50px] h-[50px] !rounded-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                    <InputOTPSlot index={1} className="w-[50px] h-[50px] !rounded-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                    <InputOTPSlot index={2} className="w-[50px] h-[50px] !rounded-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                    <InputOTPSlot index={3} className="w-[50px] h-[50px] !rounded-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                    <InputOTPSlot index={4} className="w-[50px] h-[50px] !rounded-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                    <InputOTPSlot index={5} className="w-[50px] h-[50px] !rounded-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </InputOTPGroup>
                            </InputOTP>
                            <div className="text-center text-sm">
                                {value === "" ? (
                                    <>Enter your one-time password.</>
                                ) : (
                                    <>You entered: {value}</>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Button */}
                <button className="w-full bg-gradient-to-r from-purple-700 to-violet-600 hover:opacity-90 transition-all text-white font-semibold py-3 rounded-lg shadow-lg cursor-pointer">
                    Verify Otp
                </button>


            </div>

        </div>
    );
}
