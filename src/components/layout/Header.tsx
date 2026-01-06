import SearchUsers from "@/components/layout/SearchUsers";
import UserButton from "@/components/layout/UserButton";
import ConnectWalletButton from "@/components/layout/ConnectWalletButton";
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
          <button className="rounded-lg border border-black bg-white p-2 cursor-pointer">
            <NotebookPen className="h-5 w-5 text-black " />
          </button>
          <UserButton />
        </div>
      </div>
    </>
  );
}
