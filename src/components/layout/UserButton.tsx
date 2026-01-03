"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleUser, LogIn, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import GoogleIcon from "@/components/icons/GoogleIcon";
import GitHubIcon from "@/components/icons/GitHubIcon";

export default function UserButton() {
    const [showMenu, setShowMenu] = useState(false);

    const { data: session, isPending } = authClient.useSession();

    const handleGoogleLogin = () => {
        authClient.signIn.social({ provider: "google" });
    };

    const handleGithubLogin = () => {
        authClient.signIn.social({ provider: "github" });
    };

    const handleLogout = async () => {
        await authClient.signOut();
        setShowMenu(false);
    };

    // Show loading state
    if (isPending) {
        return <CircleUser size={32} className="animate-pulse text-gray-400" />;
    }

    // Not logged in - show login options
    if (!session) {
        return (
            <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="cursor-pointer">
                    <CircleUser size={32} />
                </button>

                {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border-none rounded-md shadow-lg z-10">
                        <ul>
                            <li className="hover:bg-gray-100">
                                <Link 
                                    href="/sign-in"
                                    className="flex items-center gap-2 px-4 py-2"
                                    onClick={() => setShowMenu(false)}
                                >
                                    <Mail className="w-4 h-4" />
                                    Sign in with email
                                </Link>
                            </li>
                            <li 
                                onClick={handleGoogleLogin}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                            >
                                <GoogleIcon className="w-4 h-4" />
                                Sign in with Google
                            </li>
                            <li 
                                onClick={handleGithubLogin}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                            >
                                <GitHubIcon className="w-4 h-4" />
                                Sign in with GitHub
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    // Logged in - show user menu
    return (
        <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="cursor-pointer flex items-center gap-2">
                {session.user.image ? (
                    <img 
                        src={session.user.image} 
                        alt={session.user.name || "User"} 
                        className="w-8 h-8 rounded-full"
                    />
                ) : (
                    <CircleUser size={32} />
                )}
            </button>

            {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border-none rounded-md shadow-lg z-10">
                    <div className="px-4 py-2 border-b text-sm text-gray-600">
                        {session.user.name || session.user.email}
                    </div>
                    <ul>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Profile</li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                        <li 
                            onClick={handleLogout}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
                        >
                            Logout
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}