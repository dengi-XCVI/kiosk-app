"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "@/types/types";


export default function UserListItem({user}:{user:User}) {
    return (
        <>
        <li className="cursor-pointer hover:bg-gray-100">
            <Link href={`/profile/${user.id}`}>
                <div className="flex items-center gap-2">
                    <p>I</p>
                    <p>{user.name}</p>
                </div>
            </Link>
        </li>
        </>
    );
}