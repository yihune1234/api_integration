import { createContext, useContext } from "react";

export const initialUser = {
  userId: "usr-awash-042",
  organizationName: "Awash Distributors PLC",
  contactEmail: "ops@awash.et",
  role: "user",
};

export const initialAdmin = {
  userId: "usr-admin-001",
  organizationName: "EthioBridge Operations",
  contactEmail: "admin@ethiobridge.et",
  role: "admin",
};

export const seedKeys = [
  {
    id: "key-9f2a",
    keyPrefix: "eb_live_9f2a",
    status: "active",
    plan: "business",
    createdAt: "2026-08-11T09:14:00Z",
  },
  {
    id: "key-241c",
    keyPrefix: "eb_live_241c",
    status: "active",
    plan: "free",
    createdAt: "2026-07-22T13:48:00Z",
  },
  {
    id: "key-118b",
    keyPrefix: "eb_live_118b",
    status: "revoked",
    plan: "free",
    createdAt: "2026-05-03T08:21:00Z",
  },
];

export const seedUsage = {
  total: 4213,
  daily: [
    { date: "2026-08-05", count: 72, failed: 2, successful: 70 },
    { date: "2026-08-06", count: 104, failed: 3, successful: 101 },
    { date: "2026-08-07", count: 88, failed: 1, successful: 87 },
    { date: "2026-08-08", count: 141, failed: 4, successful: 137 },
    { date: "2026-08-09", count: 118, failed: 2, successful: 116 },
    { date: "2026-08-10", count: 132, failed: 3, successful: 129 },
    { date: "2026-08-11", count: 42, failed: 1, successful: 41 },
  ],
  monthly: [
    { month: "2026-03", count: 682 },
    { month: "2026-04", count: 744 },
    { month: "2026-05", count: 910 },
    { month: "2026-06", count: 1052 },
    { month: "2026-07", count: 825 },
    { month: "2026-08", count: 4213 },
  ],
};

export const seedUsers = [
  {
    userId: "usr-awash-042",
    organizationName: "Awash Distributors PLC",
    status: "active",
    createdAt: "2026-03-18T10:20:00Z",
  },
  {
    userId: "usr-dera-108",
    organizationName: "Dera Health Network",
    status: "active",
    createdAt: "2026-04-02T08:05:00Z",
  },
  {
    userId: "usr-nile-883",
    organizationName: "Nile Freight & Trade",
    status: "suspended",
    createdAt: "2026-05-19T14:11:00Z",
  },
  {
    userId: "usr-selam-227",
    organizationName: "Selam Microfinance",
    status: "active",
    createdAt: "2026-06-07T11:47:00Z",
  },
  {
    userId: "usr-gebeta-391",
    organizationName: "Gebeta Retail Systems",
    status: "active",
    createdAt: "2026-07-13T09:36:00Z",
  },
];

export const seedAdminKeys = [
  {
    id: "key-9f2a",
    userId: "usr-awash-042",
    keyPrefix: "eb_live_9f2a",
    status: "active",
    plan: "business",
    createdAt: "2026-08-11T09:14:00Z",
  },
  {
    id: "key-241c",
    userId: "usr-awash-042",
    keyPrefix: "eb_live_241c",
    status: "active",
    plan: "free",
    createdAt: "2026-07-22T13:48:00Z",
  },
  {
    id: "key-d312",
    userId: "usr-dera-108",
    keyPrefix: "eb_live_d312",
    status: "active",
    plan: "business",
    createdAt: "2026-07-30T10:09:00Z",
  },
  {
    id: "key-a12e",
    userId: "usr-nile-883",
    keyPrefix: "eb_live_a12e",
    status: "revoked",
    plan: "free",
    createdAt: "2026-06-04T16:19:00Z",
  },
];

export const seedLogs = [
  {
    id: "log-8821",
    userId: "usr-awash-042",
    action: "extract.success",
    timestamp: "2026-08-11T09:21:05Z",
    ipAddress: "196.188.24.17",
    endpoint: "/v1/extract",
  },
  {
    id: "log-8820",
    userId: "usr-dera-108",
    action: "key.created",
    timestamp: "2026-08-11T09:14:22Z",
    ipAddress: "196.188.18.44",
    endpoint: "/api-keys",
  },
  {
    id: "log-8819",
    userId: "usr-nile-883",
    action: "auth.failed",
    timestamp: "2026-08-11T08:58:11Z",
    ipAddress: "41.78.92.6",
    endpoint: "/auth/login",
  },
  {
    id: "log-8818",
    userId: "usr-awash-042",
    action: "extract.failed",
    timestamp: "2026-08-11T08:44:39Z",
    ipAddress: "196.188.24.17",
    endpoint: "/v1/extract",
  },
  {
    id: "log-8817",
    userId: "usr-selam-227",
    action: "profile.updated",
    timestamp: "2026-08-10T17:31:02Z",
    ipAddress: "196.188.31.21",
    endpoint: "/user/profile",
  },
  {
    id: "log-8816",
    userId: "usr-gebeta-391",
    action: "key.revoked",
    timestamp: "2026-08-10T16:04:18Z",
    ipAddress: "196.188.12.91",
    endpoint: "/api-keys/:id/revoke",
  },
];

export const initialPlans = [
  { plan: "free", maxRequestsPerDay: 100 },
  { plan: "business", maxRequestsPerDay: 10000 },
  { plan: "enterprise", maxRequestsPerDay: null },
];

export type Session = typeof initialUser | typeof initialAdmin | null;

export type DemoContextValue = {
  session: Session;
  setSession: (session: Session) => void;
  keys: typeof seedKeys;
  setKeys: (keys: typeof seedKeys) => void;
  adminKeys: typeof seedAdminKeys;
  setAdminKeys: (keys: typeof seedAdminKeys) => void;
  users: typeof seedUsers;
  setUsers: (users: typeof seedUsers) => void;
  plans: typeof initialPlans;
  setPlans: (plans: typeof initialPlans) => void;
  usage: typeof seedUsage;
};

export const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("Demo context is unavailable");
  return value;
}
