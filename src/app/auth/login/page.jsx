"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";


export default function LoginPage() {


    return (
        <div className="min-h-screen bg-[#0d0033] flex flex-col items-center justify-center p-4">
            <div className="w-125 max-w-full bg-[#f3f3f3] rounded-2xl shadow-2xl py-10 px-8">

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
                        <Label className="mb-2">Email</Label>
                        <Input type="email" placeholder="Email" className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div className="w-full">
                        <Label className="mb-2">Password</Label>
                        <Input type="password" placeholder="Password" className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        <p className="text-sm text-muted-foreground mt-2 font-semibold">
                            Forgot your password? <a href="#" className="text-primary hover:underline">Reset it</a>
                        </p>
                    </div>
                </div>

                {/* Button */}
                <button className="w-full bg-linear-to-r from-purple-700 to-violet-600 hover:opacity-90 transition-all text-white font-semibold py-3 rounded-lg shadow-lg cursor-pointer">
                    Sign in to SynC AI
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
                Don&apos;t have an account yet?  <Link href="/auth/register" className="text-blue-400 hover:underline">Create an account</Link>
            </p>
        </div>
    );
}
