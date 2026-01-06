"use client";

import { useRouter } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function WriteButton() {
    const router = useRouter();
    const { data: session } = authClient.useSession();

    const handleGoWrite = () => {
        if (!session) {
            router.push("/sign-in");
        } else {
            router.push("/write");
        }
    };

    return (
        <button
            onClick={handleGoWrite}
            className="rounded-lg border border-black bg-white p-2 cursor-pointer"
        >
            <NotebookPen className="h-5 w-5 text-black" />
        </button>
    );
}