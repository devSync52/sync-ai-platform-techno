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


export default function RegisterPage() {


    return (
        <div className="min-h-screen bg-[#0d0033] flex flex-col items-center justify-center p-4">
            <div className="w-[600px] max-w-full bg-[#f3f3f3] rounded-2xl shadow-2xl py-10 px-8">

                {/* Robot Icon */}
                <div className="flex items-start justify-center pb-6">
                    <Image
                        src="/assets/logo.png"
                        alt="robot"
                        width={145} height={145}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 w-full mb-8">
                    <div className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div>
                                <Label className="mb-2">First Name</Label>
                                <Input type="text" placeholder="First Name" className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <Label className="mb-2">Last Name</Label>
                                <Input type="text" placeholder="Last Name" className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>
                    </div>
                    <div className="w-full">
                        <Label className="mb-2">Email</Label>
                        <Input type="email" placeholder="Email" className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>

                    <div className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div className="w-full">
                                <Label className="mb-2">Password</Label>
                                <Input type="password" placeholder="Password" className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div className="w-full">
                                <Label className="mb-2">Confirm Password</Label>
                                <Input type="password" placeholder="Confirm Password" className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>
                    </div>
                    <div className="w-full">
                        <Label className="mb-2">Company Name</Label>
                        <Input type="text" placeholder="Email" className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div className="w-full">
                        <Label className="mb-2">Company Address</Label>
                        <Input type="text" placeholder="Company Address" className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div>
                                <Label className="mb-2">City</Label>
                                <Input type="text" placeholder="City" className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <Label className="mb-2">Zip Code</Label>
                                <Input type="text" placeholder="712235" className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Button */}
                <button className="w-full bg-gradient-to-r from-purple-700 to-violet-600 hover:opacity-90 transition-all text-white font-semibold py-3 rounded-lg shadow-lg cursor-pointer">
                    Signup to SynC AI
                </button>

                <div className="pt-5">
                    <div className="mb-5">
                        <p className="text-sm text-muted-foreground mt-2 text-center font-semibold">Or Continue With</p>
                    </div>
                    <div className="flex justify-center gap-2">
                        <Button variant="outline" className="py-5 px-4">
                            <Image
                                src="/assets/google.svg"
                                alt="robot"
                                width={20} height={20}
                            />
                            Sign With Google
                        </Button>
                        <Button variant="outline" className="py-5 px-4">
                            <Image
                                src="/assets/facebook.svg"
                                alt="robot"
                                width={24} height={24}
                            />
                            Sign With Facebook
                        </Button>
                    </div>
                </div>
            </div>
            <p className="text-md text-white mt-5">
                Already have an account?   <a href="/auth/login" className="text-blue-400 hover:underline">Sign In</a>
            </p>
        </div>
    );
}
