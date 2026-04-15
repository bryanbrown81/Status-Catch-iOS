export type VendorStatus =
  | "OPERATIONAL"
  | "DEGRADED"
  | "PARTIAL_OUTAGE"
  | "MAJOR_OUTAGE"
  | "UNDER_MAINTENANCE"
  | "UNKNOWN";

export type VendorCategory =
  | "COMMUNICATION"
  | "CLOUD"
  | "PAYMENTS"
  | "SECURITY"
  | "OBSERVABILITY"
  | "PRODUCTIVITY"
  | "DEVELOPER_TOOLS"
  | "OTHER";

export type IncidentImpact = "NONE" | "MINOR" | "MAJOR" | "CRITICAL";
export type IncidentStatus =
  | "INVESTIGATING"
  | "IDENTIFIED"
  | "MONITORING"
  | "RESOLVED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED";

export interface Vendor {
  id: string;
  name: string;
  website: string;
  category: VendorCategory;
  status: VendorStatus;
  logoChar: string;
  logoColor: string;
}

export interface IncidentUpdate {
  id: string;
  body: string;
  status: IncidentStatus;
  createdAt: string;
}

export interface Incident {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  status: IncidentStatus;
  impact: IncidentImpact;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  updates: IncidentUpdate[];
}

export interface AlertRule {
  id: string;
  name: string;
  vendorIds: string[];
  impactLevel: IncidentImpact;
  isEnabled: boolean;
  createdAt: string;
}

export const STATUS_COLORS: Record<VendorStatus, string> = {
  OPERATIONAL: "#22C55E",
  DEGRADED: "#F59E0B",
  PARTIAL_OUTAGE: "#F97316",
  MAJOR_OUTAGE: "#EF4444",
  UNDER_MAINTENANCE: "#A855F7",
  UNKNOWN: "#6B7280",
};

export const STATUS_LABELS: Record<VendorStatus, string> = {
  OPERATIONAL: "Operational",
  DEGRADED: "Degraded",
  PARTIAL_OUTAGE: "Partial Outage",
  MAJOR_OUTAGE: "Major Outage",
  UNDER_MAINTENANCE: "Maintenance",
  UNKNOWN: "Unknown",
};

export const IMPACT_COLORS: Record<IncidentImpact, string> = {
  NONE: "#6B7280",
  MINOR: "#F59E0B",
  MAJOR: "#F97316",
  CRITICAL: "#EF4444",
};

export const IMPACT_LABELS: Record<IncidentImpact, string> = {
  NONE: "None",
  MINOR: "Minor",
  MAJOR: "Major",
  CRITICAL: "Critical",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  INVESTIGATING: "Investigating",
  IDENTIFIED: "Identified",
  MONITORING: "Monitoring",
  RESOLVED: "Resolved",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const CATEGORY_LABELS: Record<VendorCategory, string> = {
  COMMUNICATION: "Communication",
  CLOUD: "Cloud",
  PAYMENTS: "Payments",
  SECURITY: "Security",
  OBSERVABILITY: "Observability",
  PRODUCTIVITY: "Productivity",
  DEVELOPER_TOOLS: "Dev Tools",
  OTHER: "Other",
};

export const VENDOR_CATALOG: Vendor[] = [
  { id: "twilio", name: "Twilio", website: "twilio.com", category: "COMMUNICATION", status: "OPERATIONAL", logoChar: "T", logoColor: "#F22F46" },
  { id: "genesys", name: "Genesys Cloud", website: "genesys.com", category: "COMMUNICATION", status: "OPERATIONAL", logoChar: "G", logoColor: "#FF4F1F" },
  { id: "sendgrid", name: "SendGrid", website: "sendgrid.com", category: "COMMUNICATION", status: "OPERATIONAL", logoChar: "S", logoColor: "#1A82E2" },
  { id: "zoom", name: "Zoom", website: "zoom.us", category: "COMMUNICATION", status: "OPERATIONAL", logoChar: "Z", logoColor: "#2D8CFF" },
  { id: "aws", name: "AWS", website: "aws.amazon.com", category: "CLOUD", status: "DEGRADED", logoChar: "A", logoColor: "#FF9900" },
  { id: "azure", name: "Azure", website: "azure.microsoft.com", category: "CLOUD", status: "OPERATIONAL", logoChar: "Z", logoColor: "#0078D4" },
  { id: "gcp", name: "Google Cloud", website: "cloud.google.com", category: "CLOUD", status: "OPERATIONAL", logoChar: "G", logoColor: "#4285F4" },
  { id: "cloudflare", name: "Cloudflare", website: "cloudflare.com", category: "CLOUD", status: "OPERATIONAL", logoChar: "C", logoColor: "#F38020" },
  { id: "stripe", name: "Stripe", website: "stripe.com", category: "PAYMENTS", status: "OPERATIONAL", logoChar: "S", logoColor: "#635BFF" },
  { id: "paypal", name: "PayPal", website: "paypal.com", category: "PAYMENTS", status: "OPERATIONAL", logoChar: "P", logoColor: "#003087" },
  { id: "okta", name: "Okta", website: "okta.com", category: "SECURITY", status: "OPERATIONAL", logoChar: "O", logoColor: "#007DC1" },
  { id: "crowdstrike", name: "CrowdStrike", website: "crowdstrike.com", category: "SECURITY", status: "OPERATIONAL", logoChar: "C", logoColor: "#E0002A" },
  { id: "datadog", name: "Datadog", website: "datadoghq.com", category: "OBSERVABILITY", status: "OPERATIONAL", logoChar: "D", logoColor: "#632CA6" },
  { id: "pagerduty", name: "PagerDuty", website: "pagerduty.com", category: "OBSERVABILITY", status: "OPERATIONAL", logoChar: "P", logoColor: "#06AC38" },
  { id: "newrelic", name: "New Relic", website: "newrelic.com", category: "OBSERVABILITY", status: "OPERATIONAL", logoChar: "N", logoColor: "#00AC69" },
  { id: "slack", name: "Slack", website: "slack.com", category: "PRODUCTIVITY", status: "OPERATIONAL", logoChar: "S", logoColor: "#4A154B" },
  { id: "salesforce", name: "Salesforce", website: "salesforce.com", category: "PRODUCTIVITY", status: "OPERATIONAL", logoChar: "S", logoColor: "#00A1E0" },
  { id: "zendesk", name: "Zendesk", website: "zendesk.com", category: "PRODUCTIVITY", status: "OPERATIONAL", logoChar: "Z", logoColor: "#03363D" },
  { id: "google", name: "Google Workspace", website: "workspace.google.com", category: "PRODUCTIVITY", status: "MAJOR_OUTAGE", logoChar: "G", logoColor: "#4285F4" },
  { id: "github", name: "GitHub", website: "github.com", category: "DEVELOPER_TOOLS", status: "OPERATIONAL", logoChar: "G", logoColor: "#24292E" },
  { id: "jira", name: "Jira", website: "atlassian.com", category: "DEVELOPER_TOOLS", status: "UNDER_MAINTENANCE", logoChar: "J", logoColor: "#0052CC" },
  { id: "confluent", name: "Confluent", website: "confluent.io", category: "DEVELOPER_TOOLS", status: "PARTIAL_OUTAGE", logoChar: "C", logoColor: "#CC2936" },
  { id: "abrigo", name: "Abrigo", website: "abrigo.com", category: "OTHER", status: "OPERATIONAL", logoChar: "A", logoColor: "#5B8DD9" },
];

export const DEFAULT_SUBSCRIPTIONS = ["twilio", "aws", "cloudflare", "github", "stripe", "datadog"];

const now = Date.now();

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "inc-001",
    vendorId: "aws",
    vendorName: "AWS",
    title: "US-EAST-1 Elevated Error Rates",
    status: "INVESTIGATING",
    impact: "MAJOR",
    createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 15 * 60 * 1000).toISOString(),
    updates: [
      { id: "u1", body: "We are investigating elevated error rates in the US-EAST-1 region.", status: "INVESTIGATING", createdAt: new Date(now - 45 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: "inc-002",
    vendorId: "google",
    vendorName: "Google Workspace",
    title: "Gmail Service Disruption",
    status: "IDENTIFIED",
    impact: "CRITICAL",
    createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 8 * 60 * 1000).toISOString(),
    updates: [
      { id: "u2a", body: "The issue has been identified. Engineering is working on a fix.", status: "IDENTIFIED", createdAt: new Date(now - 8 * 60 * 1000).toISOString() },
      { id: "u2b", body: "We are investigating reports of Gmail being unavailable.", status: "INVESTIGATING", createdAt: new Date(now - 20 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: "inc-003",
    vendorId: "confluent",
    vendorName: "Confluent",
    title: "Cloud API Increased Latency",
    status: "MONITORING",
    impact: "MINOR",
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 30 * 60 * 1000).toISOString(),
    updates: [
      { id: "u3", body: "A fix has been deployed. We are monitoring the situation.", status: "MONITORING", createdAt: new Date(now - 30 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: "inc-004",
    vendorId: "jira",
    vendorName: "Jira",
    title: "Scheduled Maintenance Window",
    status: "IN_PROGRESS",
    impact: "NONE",
    createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 5 * 60 * 1000).toISOString(),
    updates: [
      { id: "u4", body: "Maintenance is in progress. Services may be intermittently unavailable.", status: "IN_PROGRESS", createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: "inc-005",
    vendorId: "twilio",
    vendorName: "Twilio",
    title: "Voice Call Quality Degradation",
    status: "RESOLVED",
    impact: "MINOR",
    createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 20 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(now - 20 * 60 * 60 * 1000).toISOString(),
    updates: [
      { id: "u5", body: "This incident has been resolved.", status: "RESOLVED", createdAt: new Date(now - 20 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: "inc-006",
    vendorId: "stripe",
    vendorName: "Stripe",
    title: "Payment API Elevated Latency",
    status: "RESOLVED",
    impact: "MAJOR",
    createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 44 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(now - 44 * 60 * 60 * 1000).toISOString(),
    updates: [
      { id: "u6", body: "The issue has been fully resolved.", status: "RESOLVED", createdAt: new Date(now - 44 * 60 * 60 * 1000).toISOString() },
    ],
  },
];
