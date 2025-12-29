"use client";

import Image from "next/image";
import React from "react";
import { CircleUser, Search } from "lucide-react";

export default function Home() {
  const [searchParams, setSearchParams] = React.useState<string>('');



  return (
    <>
      <div className= "mt-4 flex items-center justify-between">
        <div className="mx-4 flex items-center gap-4">
          <h1 className="text-5xl font-bold">Kiosk</h1>
          <div className="flex items center gap-3 rounded-full border border-gray-300">
            <Search size={24}/>
            <input className="border-none focus:outline-none" type="text" onChange={e => setSearchParams(e.target.value)} placeholder="Enter something..." value={searchParams} />
          </div>
        </div>
        <div className="mr-6 flex items-center gap-4">
          <button>
            <CircleUser size={32} />
          </button>
        </div>
      </div>
    </>
  );
}


