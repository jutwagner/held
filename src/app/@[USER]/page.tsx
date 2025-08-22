"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getUserByHandle, getRotations } from "@/lib/firebase-services";
import { UserDoc, Rotation } from "@/types";
import Image from "next/image";
import Link from "next/link";

export default function PublicUserPage() {
  const params = useParams();
  // Always decode and strip leading '@' for vanity URLs
  let rawHandle = params?.USER ?? "";
  if (Array.isArray(rawHandle)) rawHandle = rawHandle[0] ?? "";
  let handle = rawHandle;
  try {
    handle = decodeURIComponent(handle);
  } catch {}
  if (handle.startsWith("@")) handle = handle.slice(1);
  handle = handle.trim();
  // Debug: show both raw and processed handle
  console.log('[DEBUG] PublicUserPage rawHandle:', rawHandle);
  console.log('[DEBUG] PublicUserPage processed handle:', handle);
  const [user, setUser] = useState<UserDoc | null>(null);
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAndRotations() {
      setLoading(true);
      // Use processed handle for query
      if (!handle) {
        setUser(null);
        setLoading(false);
        return;
      }
      console.log('[DEBUG] getUserByHandle lookup:', handle);
      const userDoc = await getUserByHandle(handle);
      console.log('[DEBUG] getUserByHandle result:', userDoc);
      if (userDoc && userDoc.isPublicProfile) {
        console.log('[DEBUG] isPublicProfile is TRUE, showing public page');
        setUser(userDoc);
        const userRotations = await getRotations(userDoc.uid ?? "");
        setRotations(userRotations);
      } else {
        console.log('[DEBUG] isPublicProfile is FALSE or user not found, showing private page');
        setUser(null);
      }
      setLoading(false);
    }
    fetchUserAndRotations();
  }, [params?.USER]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-lg">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold mb-2">User not found or profile is private</h1>
          <Link href="/" className="text-blue-600 hover:underline">Return to Held</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="held-container py-12">
        <div className="flex flex-col items-center mb-10">
          <Image src={user.avatarUrl || "/icon-144x144.png"} alt={user.displayName} width={96} height={96} className="w-24 h-24 rounded-full mb-4" />
          <h1 className="text-4xl font-serif font-bold mb-2">{user.displayName}</h1>
          <p className="text-lg text-gray-600 mb-2">@{user.handle}</p>
          {user.bio && <p className="text-base text-gray-700 mb-2 max-w-xl text-center">{user.bio}</p>}
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-serif font-medium mb-4">Rotations</h2>
          {rotations.length === 0 ? (
            <p className="text-gray-500">No rotations yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rotations.map((rotation: Rotation) => (
                <Link key={rotation.id} href={`/rotations/${rotation.id}`} className="held-card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <h3 className="text-xl font-serif font-semibold mb-2">{rotation.name}</h3>
                  <p className="text-gray-600 mb-2">{rotation.description}</p>
                  <p className="text-sm text-gray-500">{rotation.objectIds?.length || 0} object{rotation.objectIds?.length !== 1 ? "s" : ""}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
