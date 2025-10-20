"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  // Username/password only
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: true,
      callbackUrl: "/dashboard",
    });
    if (!res) return; // next-auth handled redirect
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-rfl-navy mb-4">Log in</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="Enter username" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="Enter password" required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full bg-rfl-navy text-white rounded-md py-2">Continue</button>
        </form>
        <p className="mt-4 text-sm text-center">
          New to RFL? <a href="/signup" className="text-rfl-coral font-medium">Create an account</a>
        </p>
      </div>
    </div>
  );
}


