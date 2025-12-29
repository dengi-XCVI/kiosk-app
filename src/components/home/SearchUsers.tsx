"use client";

import Image from "next/image";
import React from "react";
import { Search } from "lucide-react";

export default function SearchUsers() {
    const [searchParams, setSearchParams] = React.useState<string>('');


    return (
        <>
        <Search size={24} />
        <input className="border-none focus:outline-none" type="text" onChange={e => setSearchParams(e.target.value)} placeholder="Enter something..." value={searchParams} />
        </>
    );
}