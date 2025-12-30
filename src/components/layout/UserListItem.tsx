"use client";

import { useState, useEffect } from "react";
import { User } from "@/types/types";

export default function UserListItem({user}:{user:User}) {
    return (
        <>
        <li>{user.name}</li>
        </>
    );
}