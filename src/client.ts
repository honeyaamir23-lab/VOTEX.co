import { Battle, UserProfile, VoteTransaction } from "./types";

const API_BASE = "";

export async function fetchProfile(email: string, retries = 4, delayMs = 600): Promise<UserProfile> {
  const normalizedEmail = encodeURIComponent(email.toLowerCase().trim());
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/api/profile?email=${normalizedEmail}`);
      if (!res.ok) {
        throw new Error(`Profile API status: ${res.status}`);
      }
      const data = await res.json();
      if (data && data.profile) {
        return data.profile;
      }
      throw new Error("Profile payload empty");
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      console.warn(`[SDK] Profile fetch attempt ${attempt} failed, retrying in ${delayMs}ms:`, err);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2; // exponential backoff
    }
  }
  throw new Error("Failed to load user profile after retries");
}

export async function castVote(params: {
  email: string;
  battleId: string;
  contestant: 'A' | 'B';
  voteType: 'free' | 'paid';
}): Promise<{ success: boolean; profile: UserProfile; message?: string }> {
  const res = await fetch(`${API_BASE}/api/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params)
  });

  const data = await res.json();
  if (!res.ok) {
    // Return or throw specific status for UI routing (e.g. triggers payment modal)
    const err = new Error(data.message || "Failed to submit vote") as any;
    err.requiresPayment = data.requiresPayment;
    err.insufficientFunds = data.insufficientFunds;
    throw err;
  }

  return data;
}

export async function depositCoins(
  email: string,
  amount: number
): Promise<{ success: boolean; profile: UserProfile; transaction: VoteTransaction }> {
  const res = await fetch(`${API_BASE}/api/deposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, amount })
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to make simulated deposit");
  }

  return res.json();
}

/**
 * Listens to the Server-Sent Events stream for real-time updates.
 * Calls `onUpdate` with the latest battles array and transaction logs.
 */
export function subscribeToRealtimeUpdates(
  onUpdate: (data: { battles: Battle[]; transactions: VoteTransaction[] }) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/api/battles/stream`);

  eventSource.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onUpdate({
        battles: parsed.battles,
        transactions: parsed.transactions || []
      });
    } catch (err) {
      console.error("Error parsing real-time broadcast message:", err);
    }
  };

  eventSource.onerror = (err) => {
    console.error("EventSource connection encountered error. Retrying...", err);
  };

  // Return unsubscribe cleanup function
  return () => {
    eventSource.close();
  };
}
