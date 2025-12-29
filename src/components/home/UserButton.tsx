"use client";

import Image from "next/image";
import React from "react";
import { CircleUser } from "lucide-react";

export default function UserButton() {

    return (
        <>
        <button>
            <CircleUser size={32} />
          </button>
        </>
    );
}