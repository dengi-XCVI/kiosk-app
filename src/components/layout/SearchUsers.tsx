/**
 * SearchUsers Component
 * 
 * A debounced search input for finding users by name.
 * 
 * Features:
 * - Only searches when input has 3+ characters
 * - 200ms debounce to avoid excessive API calls
 * - Aborts pending requests when input changes
 * - Shows dropdown list of matching users
 */

"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import UserListItem from "./UserListItem";
import { User } from "@/types/types";


export default function SearchUsers() {
    /** Current search input value */
    const [searchFor, setSearchFor] = useState<string>('');
    /** List of users matching the search query */
    const [users, setUsers] = useState<Array<User>>([]);

    /**
     * Effect: Performs debounced user search
     * - Clears results if query is too short
     * - Waits 200ms after last keystroke before searching
     * - Cancels pending request if user types again
     */
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
                <ul className="absolute top-full left-0 w-full bg-white border-none rounded-md shadow-lg z-50 mt-1">
                    {users.map(user => (
                        <UserListItem key={user.id} user={user} />
                    ))}
                </ul>
            )}
        </div>
    );
}