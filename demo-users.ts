import "server-only";

export type DemoSessionUser = { id: string; name: string };

type DemoUser = DemoSessionUser & { passcode: string };

const DEMO_USERS: Record<string, DemoUser> = {
  "HOSTEL-01": { id: "HOSTEL-01", name: "Achintya Singh", passcode: "1234" },
  "HOSTEL-02": { id: "HOSTEL-02", name: "Puran", passcode: "2345" },
  "HOSTEL-03": { id: "HOSTEL-03", name: "Rahul Verma", passcode: "3456" },
  "HOSTEL-04": { id: "HOSTEL-04", name: "Priya Sharma", passcode: "4567" },
  "HOSTEL-05": { id: "HOSTEL-05", name: "Karan Mehta", passcode: "5678" },
};

export function verifyDemoCredentials(uid: string, passcode: string): DemoSessionUser | null {
  if (!/^\d{4}$/.test(passcode)) return null;
  const user = DEMO_USERS[uid.trim().toUpperCase()];
  return user?.passcode === passcode ? { id: user.id, name: user.name } : null;
}

export function getDemoUserById(uid: string): DemoSessionUser | null {
  const user = DEMO_USERS[uid];
  return user ? { id: user.id, name: user.name } : null;
}

export function getDemoUsers() {
  return Object.values(DEMO_USERS).map(({ id, name, passcode }) => ({ id, name, passcode }));
}
