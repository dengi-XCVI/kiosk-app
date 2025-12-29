import Image from "next/image";
import React from "react";
import SearchUsers from "@/components/home/SearchUsers";
import UserButton from "@/components/home/UserButton";
import { User } from "lucide-react";

export default function Home() {
  
  return (
    <>
      <div className= "mt-4 flex items-center justify-between">
        <div className="mx-4 flex items-center gap-4">
          <h1 className="text-5xl font-bold">Kiosk</h1>
          <div className="flex items center gap-3 rounded-full border border-gray-300">
            <SearchUsers />
          </div>
        </div>
        <div className="mr-6 flex items-center gap-4">
          <UserButton />
        </div>
      </div>
    </>
  );
}


