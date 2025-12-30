"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import UserListItem from "./UserListItem";
import { User } from "@/types/types";


export default function SearchUsers() {
    const [searchFor, setSearchFor] = useState<string>('');
    const [users, setUsers] = useState<Array<User>>([]);

    useEffect(() => {
        if (searchFor.length < 3) {
            setUsers([]);
            return;
        }
        
        const controller = new AbortController();
        const signal = controller.signal;
        
        const timeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/users/searchByName?name=${searchFor}`, { signal });
                const data = await response.json();
                console.log(data);
                setUsers(data.users);
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    console.log('Fetch aborted');
                    return;
                }
                console.error("Error fetching users:", error);
            }
        }, 200); // Debounce for 200ms
        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [searchFor]);

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <Search size={24} />
                <input className="border-none focus:outline-none" type="text" onChange={e => setSearchFor(e.target.value)} placeholder="Enter something..." value={searchFor} />
            </div>
            {users.length > 0 && (
                <ul className="absolute top-full left-0 w-full bg-white border-none rounded-md shadow-lg z-10 mt-1">
                    {users.map(user => (
                        <UserListItem user={user} />
                    ))}
                </ul>
            )}
        </div>
    );
}