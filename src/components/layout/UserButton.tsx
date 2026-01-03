"use client";

import { useState, useEffect } from "react";
import { CircleUser } from "lucide-react";

export default function UserButton() {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <>
        <div className="relative">
        <button onClick={() => setShowMenu(!showMenu)} className="cursor-pointer">
            <CircleUser size={32} />
        </button>
        
        {showMenu && (
            <div className="absolute right-4 mt-2 w-48 bg-white border-none rounded-md shadow-lg z-10">
                <ul>
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Profile</li>
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Logout</li>
                </ul>
            </div>
        )}
        </div>
        </>
    );
}