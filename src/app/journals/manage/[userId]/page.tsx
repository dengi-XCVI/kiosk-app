/**
 * Journal Management Page
 *
 * Route: /journals/[userId]
 *
 * Client component that lets a user manage their journals:
 * - Create a new journal (name + description)
 * - View all journals they belong to (with role badge)
 * - For ADMIN journals: view/add/remove members and change roles
 *
 * Only the profile owner sees the management controls. Other visitors
 * see a read-only list of the user's journals.
 */

"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { Plus, Trash2, Shield, Pen, Users, BookOpen, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { JournalMembership, JournalMemberEntry } from "@/types/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CreateJournalForm {
    name: string;
    description: string;
}

export default function JournalManagementPage({
    params,
}: {
    params: Promise<{ userId: string }>;
}) {
    const { userId } = use(params);

    // Auth state
    const { data: session } = authClient.useSession();
    const isOwner = session?.user?.id === userId;

    // Journal list state
    const [memberships, setMemberships] = useState<JournalMembership[]>([]);
    const [loading, setLoading] = useState(true);

    // Create journal form state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState<CreateJournalForm>({ name: "", description: "" });
    const [creating, setCreating] = useState(false);

    // Member management state (keyed by journal ID)
    const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);
    const [members, setMembers] = useState<JournalMemberEntry[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [addMemberEmail, setAddMemberEmail] = useState("");
    const [addingMember, setAddingMember] = useState(false);

    /**
     * Fetches the user's journal memberships from the API.
     */
    const fetchMemberships = useCallback(async () => {
        try {
            const res = await fetch("/api/journals");
            if (res.ok) {
                const data = await res.json();
                setMemberships(data.memberships);
            }
        } catch (error) {
            console.error("Failed to fetch memberships:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOwner) fetchMemberships();
        else setLoading(false);
    }, [isOwner, fetchMemberships]);

    /**
     * Creates a new journal and adds the current user as ADMIN.
     */
    const handleCreateJournal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.name.trim()) return;

        setCreating(true);
        try {
            const res = await fetch("/api/journals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createForm),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create journal");
            }

            // Reset form and refresh list
            setCreateForm({ name: "", description: "" });
            setShowCreateForm(false);
            await fetchMemberships();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to create journal");
        } finally {
            setCreating(false);
        }
    };

    /**
     * Fetches members for a specific journal (admin only).
     */
    const fetchMembers = async (journalId: string) => {
        setMembersLoading(true);
        try {
            const res = await fetch(`/api/journals/members?journalId=${journalId}`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members);
            }
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setMembersLoading(false);
        }
    };

    /**
     * Toggles the member panel for a journal. Fetches members if expanding.
     */
    const toggleMembers = (journalId: string) => {
        if (expandedJournalId === journalId) {
            setExpandedJournalId(null);
            setMembers([]);
        } else {
            setExpandedJournalId(journalId);
            fetchMembers(journalId);
        }
    };

    /**
     * Adds a new writer to a journal by their email address.
     */
    const handleAddMember = async (journalId: string) => {
        if (!addMemberEmail.trim()) return;

        setAddingMember(true);
        try {
            const res = await fetch("/api/journals/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ journalId, userEmail: addMemberEmail.trim() }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to add member");
            }

            setAddMemberEmail("");
            await fetchMembers(journalId);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to add member");
        } finally {
            setAddingMember(false);
        }
    };

    /**
     * Removes a member from a journal.
     */
    const handleRemoveMember = async (memberId: string, journalId: string) => {
        if (!confirm("Remove this member from the journal?")) return;

        try {
            const res = await fetch("/api/journals/members", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, journalId }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to remove member");
            }

            await fetchMembers(journalId);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to remove member");
        }
    };

    /**
     * Changes a member's role (ADMIN ↔ WRITER).
     */
    const handleChangeRole = async (memberId: string, journalId: string, newRole: "ADMIN" | "WRITER") => {
        try {
            const res = await fetch("/api/journals/members", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, journalId, role: newRole }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to change role");
            }

            const data = await res.json();

            // If the journal was deleted (no admins left), collapse the panel
            // and refresh the membership list to remove it
            if (data.deleted) {
                setExpandedJournalId(null);
                setMembers([]);
                await fetchMemberships();
                return;
            }

            // Refresh both the member list and the membership list
            // so the role badge in the journal header row also updates
            await Promise.all([fetchMembers(journalId), fetchMemberships()]);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to change role");
        }
    };

    // ── Non-owner view ───────────────────────────────────────────────────────
    if (!isOwner) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Journals</h1>
                <p className="text-gray-500">You can only manage your own journals.</p>
            </div>
        );
    }

    // ── Owner view ───────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-2xl px-4 py-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen size={24} />
                    My Journals
                </h1>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                >
                    <Plus size={16} />
                    New Journal
                </button>
            </div>

            {/* ── Create Journal Form ─────────────────────────────────────── */}
            {showCreateForm && (
                <form
                    onSubmit={handleCreateJournal}
                    className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                    <h2 className="text-lg font-semibold mb-3">Create a new journal</h2>

                    <div className="mb-3">
                        <label htmlFor="journal-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Name *
                        </label>
                        <input
                            id="journal-name"
                            type="text"
                            value={createForm.name}
                            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. The Blockchain Review"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="journal-desc" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="journal-desc"
                            value={createForm.description}
                            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="A brief description of your journal"
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={creating}
                            className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                        >
                            {creating ? "Creating…" : "Create"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* ── Journal List ────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
            ) : memberships.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>You don&apos;t have any journals yet.</p>
                    <p className="text-sm mt-1">Create one to start publishing collaboratively.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {memberships.map((membership) => (
                        <div
                            key={membership.id}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                            {/* Journal header row */}
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <Link
                                        href={`/journals/${membership.journal.slug}`}
                                        className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                                    >
                                        {membership.journal.name}
                                    </Link>
                                    {membership.journal.description && (
                                        <p className="text-sm text-gray-500 mt-0.5 truncate">
                                            {membership.journal.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 ml-4 shrink-0">
                                    {/* Role badge */}
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                            membership.role === "ADMIN"
                                                ? "bg-amber-100 text-amber-800"
                                                : "bg-blue-100 text-blue-800"
                                        }`}
                                    >
                                        {membership.role === "ADMIN" ? (
                                            <Shield size={12} />
                                        ) : (
                                            <Pen size={12} />
                                        )}
                                        {membership.role}
                                    </span>

                                    {/* Manage members button (admin only) */}
                                    {membership.role === "ADMIN" && (
                                        <button
                                            onClick={() => toggleMembers(membership.journal.id)}
                                            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                                                expandedJournalId === membership.journal.id
                                                    ? "bg-gray-200 text-gray-900"
                                                    : "text-gray-500 hover:bg-gray-100"
                                            }`}
                                        >
                                            <Users size={14} />
                                            Members
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ── Members panel (expanded, admin only) ──────────── */}
                            {expandedJournalId === membership.journal.id && (
                                <div className="border-t border-gray-200 bg-gray-50 p-4">
                                    {membersLoading ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 size={20} className="animate-spin text-gray-400" />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Member list */}
                                            <ul className="space-y-2 mb-4">
                                                {members.map((member) => (
                                                    <li
                                                        key={member.id}
                                                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {member.user.image ? (
                                                                <img
                                                                    src={member.user.image}
                                                                    alt={member.user.name || ""}
                                                                    className="h-7 w-7 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-xs font-medium">
                                                                    {member.user.name?.charAt(0)?.toUpperCase() || "?"}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {member.user.name || "Anonymous"}
                                                                </p>
                                                                <p className="text-xs text-gray-400 truncate">
                                                                    {member.user.email}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                                            {/* Role toggle */}
                                                            <button
                                                                onClick={() =>
                                                                    handleChangeRole(
                                                                        member.id,
                                                                        membership.journal.id,
                                                                        member.role === "ADMIN" ? "WRITER" : "ADMIN"
                                                                    )
                                                                }
                                                                className={`px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer ${
                                                                    member.role === "ADMIN"
                                                                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                                                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                                }`}
                                                                title={`Click to change to ${member.role === "ADMIN" ? "WRITER" : "ADMIN"}`}
                                                            >
                                                                {member.role}
                                                            </button>

                                                            {/* Remove member (don't show for self) */}
                                                            {member.user.id !== session?.user?.id && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleRemoveMember(member.id, membership.journal.id)
                                                                    }
                                                                    className="text-red-400 hover:text-red-600 cursor-pointer"
                                                                    title="Remove member"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>

                                            {/* Add member by email */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="email"
                                                    value={addMemberEmail}
                                                    onChange={(e) => setAddMemberEmail(e.target.value)}
                                                    placeholder="Add writer by email…"
                                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddMember(membership.journal.id);
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleAddMember(membership.journal.id)}
                                                    disabled={addingMember || !addMemberEmail.trim()}
                                                    className="px-3 py-1.5 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                                                >
                                                    {addingMember ? "Adding…" : "Add"}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
