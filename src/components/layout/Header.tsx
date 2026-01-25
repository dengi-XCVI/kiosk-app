/**
 * Header Component
 * 
 * The main navigation header displayed on all pages.
 * Contains:
 * - App logo/title ("Kiosk")
 * - User search bar
 * - Web3 wallet connect button
 * - Write article button
 * - User menu (login/logout, profile access)
 */

import SearchUsers from "@/components/layout/SearchUsers";
import UserButton from "@/components/layout/UserButton";
import ConnectWalletButton from "@/components/layout/ConnectWalletButton";
import WriteButton from "@/components/layout/WriteButton";
import { NotebookPen } from "lucide-react";


export default function Header() {
  
  return (
    <>
      <div className= "mt-4 flex items-center justify-between">
        <div className="mx-4 flex items-center gap-4">
          <h1 className="text-5xl font-bold">Kiosk</h1>
          <div className="flex items-center gap-3 rounded-full border border-none -300">
            <SearchUsers />
          </div>
        </div>
        <div className="mr-6 flex items-center gap-4">
          <ConnectWalletButton />
          <WriteButton />
          <UserButton />
        </div>
      </div>
    </>
  );
}
