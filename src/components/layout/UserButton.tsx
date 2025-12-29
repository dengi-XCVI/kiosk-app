"use client";

import { useState, useEffect } from "react";
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