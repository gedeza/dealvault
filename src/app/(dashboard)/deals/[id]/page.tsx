"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DealVaultLoader } from "@/components/ui/dealvault-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  FileUp,
  Users,
  MessageSquare,
  Clock,
  DollarSign,
  Download,
  Upload,
  Send,
  Eye,
  X,
  Link2,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEAL_STATUS_LABELS,
  DEAL_STATUS_COLORS,
  PARTY_ROLE_LABELS,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  VALID_STATUS_TRANSITIONS,
  type DealStatus,
  type PartyRole,
} from "@/types";
import {
  PARTY_ROLE_TO_WORKFLOW_ROLE,
  PHASE_GATE_LABELS,
  type WorkflowPhase,
  type WorkflowRole,
} from "@/types/workflow";
import { WorkflowStepper } from "@/components/workflow/WorkflowStepper";
import { PhaseActionPanel } from "@/components/workflow/PhaseActionPanel";
import { EscrowStatusCard } from "@/components/workflow/EscrowStatusCard";
import { VerificationPanel } from "@/components/workflow/VerificationPanel";
import { CustodyTracker } from "@/components/custody/CustodyTracker";
import { InitiateCustodyModal } from "@/components/custody/InitiateCustodyModal";
import { IntegrityChainViewer } from "@/components/custody/IntegrityChainViewer";
import { DealAssistant } from "@/components/deal/DealAssistant";
import { DealRiskBadge } from "@/components/deal/DealRiskBadge";
import { AnomalyDetector } from "@/components/deal/AnomalyDetector";
import { useDealEvents, type DealEventType } from "@/hooks/useDealEvents";
import { TwoFactorBadge } from "@/components/security/two-factor-badge";
import { CurrencyConverter } from "@/components/currency/currency-converter";

interface DealFull {
  id: string;
  dealNumber: string;
  title: string;
  commodity: string;
  quantity: number;
  unit: string;
  value: number;
  currency: string;
  commissionPool: number;
  status: DealStatus;
  workflowPhase: string | null;
  createdAt: string;
  creator: { id: string; name: string; email: string };
  parties: {
    id: string;
    role: PartyRole;
    side: string;
    positionInChain: number;
    commissionPct: number;
    status: string;
    user: { id: string; name: string; email: string };
  }[];
  documents: {
    id: string;
    name: string;
    type: string;
    mimeType: string;
    fileSize: number;
    sha256Hash: string;
    verified: boolean;
    visibility: string;
    createdAt: string;
    uploader: { id: string; name: string };
  }[];
  timeline: {
    id: string;
    eventType: string;
    description: string;
    metadata: string | null;
    createdAt: string;
    user: { id: string; name: string };
  }[];
  messages: {
    id: string;
    content: string;
    visibility: string;
    createdAt: string;
    sender: { id: string; name: string };
  }[];
  commissionLedger: {
    id: string;
    agreedPct: number;
    calculatedAmount: number;
    status: string;
    party: {
      role: string;
      user: { name: string };
    };
  }[];
}

export default function DealRoomPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [deal, setDeal] = useState<DealFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Workflow & Custody state
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [workflow, setWorkflow] = useState<any>(null);
  const [custody, setCustody] = useState<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const [userWorkflowRole, setUserWorkflowRole] = useState<WorkflowRole | null>(null);
  const [missingGates, setMissingGates] = useState<string[]>([]);

  const fetchDeal = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setDeal(data);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchWorkflow = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${params.id}/workflow`);
      if (res.ok) {
        const data = await res.json();
        setWorkflow(data);
      }
    } catch { /* no workflow */ }
  }, [params.id]);

  const fetchCustody = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${params.id}/custody`);
      if (res.ok) {
        const data = await res.json();
        setCustody(data);
      }
    } catch { /* no custody */ }
  }, [params.id]);

  const refreshAll = useCallback(() => {
    fetchDeal();
    fetchWorkflow();
    fetchCustody();
  }, [fetchDeal, fetchWorkflow, fetchCustody]);

  useEffect(() => {
    fetchDeal();
    fetchWorkflow();
    fetchCustody();
  }, [fetchDeal, fetchWorkflow, fetchCustody]);

  // SSE: real-time deal room updates
  useDealEvents(params.id as string, (eventType: DealEventType, _data: Record<string, unknown>) => {
    if (eventType === "new_message" || eventType === "status_changed" || eventType === "party_invited" || eventType === "document_uploaded") {
      refreshAll();
      if (eventType === "new_message") {
        toast.info("New message in deal room");
      } else if (eventType === "status_changed") {
        toast.info("Deal status updated");
      } else if (eventType === "party_invited") {
        toast.info("New party invited");
      }
    }
    if (eventType === "workflow_updated") fetchWorkflow();
    if (eventType === "custody_updated") fetchCustody();
  });

  // Derive user's workflow role from deal parties
  useEffect(() => {
    if (!deal || !session?.user?.id) return;
    const party = deal.parties.find((p) => p.user.id === session.user.id);
    if (party) {
      setUserWorkflowRole(PARTY_ROLE_TO_WORKFLOW_ROLE[party.role] || null);
    } else if (deal.creator.id === session.user.id) {
      setUserWorkflowRole("seller");
    }
  }, [deal, session?.user?.id]);

  // Poll for updates on messages and timeline tabs (every 10s)
  useEffect(() => {
    if (activeTab !== "messages" && activeTab !== "timeline") return;
    const interval = setInterval(fetchDeal, 10000);
    return () => clearInterval(interval);
  }, [activeTab, fetchDeal]);

  if (loading) {
    return <DealVaultLoader message="Loading deal" size="md" />;
  }

  if (!deal) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Deal not found or access denied</p>
      </div>
    );
  }

  const currentUserId = session?.user?.id;
  const isCreator = currentUserId === deal.creator.id;
  const currentUserParty = deal.parties.find((p) => p.user.id === currentUserId);
  const sellParties = deal.parties.filter((p) => p.side === "sell");
  const buyParties = deal.parties.filter((p) => p.side === "buy");
  const completedSteps = [
    deal.parties.length > 1,
    deal.documents.length > 0,
    deal.status !== "draft",
    deal.status === "verified" || deal.status === "in_progress" || deal.status === "settled" || deal.status === "closed",
  ].filter(Boolean).length;
  const totalSteps = 4;

  return (
    <div className="space-y-6">
      {/* Deal Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{deal.title}</h1>
            <Badge
              variant="secondary"
              className={DEAL_STATUS_COLORS[deal.status]}
            >
              {DEAL_STATUS_LABELS[deal.status]}
            </Badge>
            <TwoFactorBadge
              dealValue={deal.value}
              currency={deal.currency}
              verified={deal.status !== "draft"}
            />
          </div>
          <p className="text-muted-foreground">
            {deal.dealNumber} &middot;{" "}
            <span className="capitalize">{deal.commodity}</span> &middot;{" "}
            {deal.quantity} {deal.unit} &middot; {deal.currency}{" "}
            {deal.value.toLocaleString()}
          </p>
          <CurrencyConverter amount={deal.value} currency={deal.currency} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DealAssistant dealId={deal.id} />
          <DealRiskBadge dealId={deal.id} />
          <AnomalyDetector dealId={deal.id} />
          {isCreator && !deal.workflowPhase && (
            <EnableWorkflowButton dealId={deal.id} onEnable={refreshAll} />
          )}
          {isCreator && (
            <StatusUpdater
              dealId={deal.id}
              currentStatus={deal.status}
              onUpdate={fetchDeal}
            />
          )}
        </div>
      </div>

      {/* Workflow Stepper (shown when workflow is active) */}
      {deal.workflowPhase && workflow && (
        <Card>
          <CardContent className="pt-6 pb-4">
            <WorkflowStepper currentPhase={workflow.phase as WorkflowPhase} />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="overview" className="gap-1 flex-shrink-0">
            <Shield className="h-3 w-3 hidden sm:inline" /> Overview
          </TabsTrigger>
          {deal.workflowPhase && (
            <TabsTrigger value="workflow" className="gap-1 flex-shrink-0">
              <FlaskConical className="h-3 w-3 hidden sm:inline" /> Workflow
            </TabsTrigger>
          )}
          {deal.workflowPhase && (
            <TabsTrigger value="custody" className="gap-1 flex-shrink-0">
              <Link2 className="h-3 w-3 hidden sm:inline" /> Custody
            </TabsTrigger>
          )}
          <TabsTrigger value="documents" className="gap-1 flex-shrink-0">
            <FileUp className="h-3 w-3 hidden sm:inline" /> Docs
          </TabsTrigger>
          <TabsTrigger value="parties" className="gap-1 flex-shrink-0">
            <Users className="h-3 w-3 hidden sm:inline" /> Parties
          </TabsTrigger>
          <TabsTrigger value="commission" className="gap-1 flex-shrink-0">
            <DollarSign className="h-3 w-3 hidden sm:inline" /> Commission
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-1 flex-shrink-0">
            <MessageSquare className="h-3 w-3 hidden sm:inline" /> Messages
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1 flex-shrink-0">
            <Clock className="h-3 w-3 hidden sm:inline" /> Timeline
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deal Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {completedSteps} of {totalSteps} milestones completed
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Sell Side */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sell Side</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sellParties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sell-side parties</p>
                ) : (
                  sellParties.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {PARTY_ROLE_LABELS[p.role]}
                        </p>
                      </div>
                      <Badge variant={p.status === "accepted" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Buy Side */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Buy Side</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {buyParties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No buy-side parties yet</p>
                ) : (
                  buyParties.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {PARTY_ROLE_LABELS[p.role]}
                        </p>
                      </div>
                      <Badge variant={p.status === "accepted" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(["SPA", "NCNDA", "IMFPA", "BCL", "POF", "FCO", "ICPO"] as const).map(
                  (type) => {
                    const hasDoc = deal.documents.some((d) => d.type === type);
                    return (
                      <div
                        key={type}
                        className={`flex items-center gap-2 rounded-md border p-2 text-sm ${
                          hasDoc
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${
                            hasDoc ? "bg-emerald-500" : "bg-muted-foreground/30"
                          }`}
                        />
                        {type}
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        {deal.workflowPhase && workflow && (
          <TabsContent value="workflow" className="space-y-4">
            <PhaseActionPanel
              dealId={deal.id}
              currentPhase={workflow.phase as WorkflowPhase}
              userRole={userWorkflowRole}
              pendingApprovals={workflow.phaseApprovals || []}
              missingGates={missingGates}
              onAction={refreshAll}
            />
            <VerificationPanel
              dealId={deal.id}
              verification={workflow.verificationRecord || null}
              userRole={userWorkflowRole}
              onUpdate={refreshAll}
            />
            <EscrowStatusCard
              dealId={deal.id}
              escrow={workflow.escrow || null}
              userRole={userWorkflowRole}
              onAction={refreshAll}
            />
            {/* Phase Approvals History */}
            {workflow.phaseApprovals && workflow.phaseApprovals.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Phase Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workflow.phaseApprovals.map((a: { id: string; phase: string; requiredRole: string; status: string; notes: string | null; decidedAt: string | null; decidedBy: { name: string } | null }) => (
                      <div key={a.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                        <div>
                          <span className="font-medium capitalize">{a.phase.replace("_", " ")}</span>
                          <span className="text-muted-foreground"> — {a.requiredRole}</span>
                          {a.notes && <p className="text-xs text-muted-foreground">{a.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {a.decidedBy && (
                            <span className="text-xs text-muted-foreground">{a.decidedBy.name}</span>
                          )}
                          <Badge
                            variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}
                          >
                            {a.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Custody Tab */}
        {deal.workflowPhase && (
          <TabsContent value="custody" className="space-y-4">
            {!custody ? (
              <Card>
                <CardContent className="py-8 text-center space-y-3">
                  <Link2 className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    Chain of custody has not been initiated for this deal.
                  </p>
                  {(userWorkflowRole === "seller" || userWorkflowRole === "broker" || userWorkflowRole === "intermediary" || isCreator) && (
                    <InitiateCustodyModal
                      dealId={deal.id}
                      onCreated={refreshAll}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <CustodyTracker
                  dealId={deal.id}
                  custody={custody}
                  userRole={userWorkflowRole}
                  currentUserId={currentUserId || ""}
                  onUpdate={refreshAll}
                />
                <IntegrityChainViewer dealId={deal.id} />
              </>
            )}
          </TabsContent>
        )}

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <DocumentUploader dealId={deal.id} onUpload={fetchDeal} />
          <DocumentPreview documents={deal.documents} />
        </TabsContent>

        {/* Parties Tab */}
        <TabsContent value="parties" className="space-y-4">
          {isCreator && <PartyInviter dealId={deal.id} onInvite={fetchDeal} />}
          {currentUserParty?.status === "invited" && (
            <PartyResponder
              dealId={deal.id}
              partyId={currentUserParty.id}
              role={currentUserParty.role}
              onRespond={fetchDeal}
            />
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sell Side</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sellParties.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{p.user.name}</p>
                      <p className="text-xs text-muted-foreground">{p.user.email}</p>
                      <p className="text-xs text-muted-foreground">{PARTY_ROLE_LABELS[p.role]}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        p.status === "accepted" ? "default" :
                        p.status === "rejected" ? "destructive" : "secondary"
                      }>
                        {p.status}
                      </Badge>
                      {p.commissionPct > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(p.commissionPct * 100).toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Buy Side</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {buyParties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No buy-side parties yet</p>
                ) : (
                  buyParties.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{p.user.name}</p>
                        <p className="text-xs text-muted-foreground">{p.user.email}</p>
                        <p className="text-xs text-muted-foreground">{PARTY_ROLE_LABELS[p.role]}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          p.status === "accepted" ? "default" :
                          p.status === "rejected" ? "destructive" : "secondary"
                        }>
                          {p.status}
                        </Badge>
                        {p.commissionPct > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {(p.commissionPct * 100).toFixed(2)}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Commission Tab */}
        <TabsContent value="commission" className="space-y-4">
          {isCreator && (
            <CommissionManager
              dealId={deal.id}
              parties={deal.parties}
              commissionPool={deal.commissionPool}
              dealValue={deal.value}
              currency={deal.currency}
              onUpdate={fetchDeal}
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commission Structure</CardTitle>
              <CardDescription>
                Commission pool: {(deal.commissionPool * 100).toFixed(2)}% of{" "}
                {deal.currency} {deal.value.toLocaleString()} ={" "}
                {deal.currency}{" "}
                {(deal.value * deal.commissionPool).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deal.parties.filter((p) => p.commissionPct > 0).length === 0 ? (
                <div className="flex flex-col items-center py-6 text-muted-foreground">
                  <DollarSign className="h-8 w-8 mb-2" />
                  <p className="text-sm">No commission allocations yet</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Party</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead>Commission %</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deal.parties
                        .filter((p) => p.commissionPct > 0)
                        .map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">
                              {p.user.name}
                            </TableCell>
                            <TableCell>{PARTY_ROLE_LABELS[p.role]}</TableCell>
                            <TableCell className="capitalize">{p.side}</TableCell>
                            <TableCell>
                              {(p.commissionPct * 100).toFixed(2)}%
                            </TableCell>
                            <TableCell>
                              {deal.currency}{" "}
                              {(deal.value * p.commissionPct).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  <Separator className="my-4" />
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total Allocated</span>
                    <span>
                      {(deal.parties.reduce((sum, p) => sum + p.commissionPct, 0) * 100).toFixed(2)}%
                      {" "}of {(deal.commissionPool * 100).toFixed(2)}% pool
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {deal.messages.length === 0 ? (
                  <div className="flex flex-col items-center text-muted-foreground py-8">
                    <MessageSquare className="h-8 w-8 mb-2" />
                    <p className="text-sm">No messages yet. Start the conversation.</p>
                  </div>
                ) : (
                  deal.messages.map((msg) => {
                    const isMe = msg.sender.id === session?.user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isMe
                              ? "bg-emerald-50 text-emerald-900"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-xs font-medium mb-1">
                            {msg.sender.name}
                          </p>
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <MessageSender dealId={deal.id} onSend={fetchDeal} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Audit Trail</CardTitle>
                  <CardDescription>
                    Immutable record of all deal events
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = `/api/deals/${deal.id}/export?format=csv`;
                      link.download = `${deal.dealNumber}_audit_log.csv`;
                      link.click();
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" /> CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = `/api/deals/${deal.id}/export?format=json`;
                      link.download = `${deal.dealNumber}_audit_log.json`;
                      link.click();
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" /> JSON
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {deal.timeline.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2" />
                  <p className="text-sm">No events yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deal.timeline.map((event) => (
                    <div key={event.id} className="flex gap-4 border-b pb-3 last:border-0">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                      <div className="flex-1">
                        <p className="text-sm">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {event.eventType.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            by {event.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Sub-components ---

function EnableWorkflowButton({
  dealId,
  onEnable,
}: {
  dealId: string;
  onEnable: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const enable = async () => {
    if (!confirm("Enable escrow workflow for this deal? This adds phase tracking, escrow management, and chain of custody.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/workflow`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Escrow workflow enabled");
        onEnable();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to enable workflow");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={enable} disabled={loading}>
      <FlaskConical className="h-4 w-4 mr-1" />
      {loading ? "Enabling..." : "Enable Escrow Workflow"}
    </Button>
  );
}

function StatusUpdater({
  dealId,
  currentStatus,
  onUpdate,
}: {
  dealId: string;
  currentStatus: DealStatus;
  onUpdate: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    const res = await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast.success("Status updated");
    } else {
      toast.error("Failed to update status");
    }
    onUpdate();
    setUpdating(false);
  }

  return (
    <Select onValueChange={updateStatus} disabled={updating}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Update Status" />
      </SelectTrigger>
      <SelectContent>
        {VALID_STATUS_TRANSITIONS[currentStatus]?.map((s) => (
          <SelectItem key={s} value={s}>
            {DEAL_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DocumentUploader({
  dealId,
  onUpload,
}: {
  dealId: string;
  onUpload: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<string>("other");
  const [visibility, setVisibility] = useState("deal");

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("dealId", dealId);
    formData.append("type", docType);
    formData.append("visibility", visibility);

    const res = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      toast.success("Document uploaded");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Upload failed");
    }

    onUpload();
    setUploading(false);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" /> Upload Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>File</Label>
            <Input type="file" name="file" required />
          </div>
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {DOCUMENT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deal">All Parties</SelectItem>
                <SelectItem value="side">My Side Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={uploading} className="gap-2">
            <FileUp className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PartyInviter({
  dealId,
  onInvite,
}: {
  dealId: string;
  onInvite: () => void;
}) {
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState<string>("buyer");

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInviting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      role,
      commissionPct: parseFloat(formData.get("commissionPct") as string || "0") / 100,
    };

    const res = await fetch(`/api/deals/${dealId}/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error);
      toast.error(json.error || "Failed to invite");
    } else {
      toast.success("Party invited");
      (e.target as HTMLFormElement).reset();
      onInvite();
    }
    setInviting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" /> Invite Party
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="party@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PARTY_ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Commission %</Label>
            <Input
              name="commissionPct"
              type="number"
              step="0.01"
              defaultValue="0"
              className="w-24"
            />
          </div>
          <Button type="submit" disabled={inviting}>
            {inviting ? "Inviting..." : "Invite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PartyResponder({
  dealId,
  partyId,
  role,
  onRespond,
}: {
  dealId: string;
  partyId: string;
  role: PartyRole;
  onRespond: () => void;
}) {
  const [responding, setResponding] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");

  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data))
      .catch(() => {});
  }, []);

  async function handleResponse(action: "accept" | "reject") {
    setResponding(true);
    await fetch(`/api/deals/${dealId}/parties/${partyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        ...(action === "accept" && selectedCompany && selectedCompany !== "none" && { companyId: selectedCompany }),
      }),
    });
    toast.success(action === "accept" ? "Invitation accepted" : "Invitation rejected");
    onRespond();
    setResponding(false);
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-medium text-sm">
              You have been invited as {PARTY_ROLE_LABELS[role]}
            </p>
            <p className="text-xs text-muted-foreground">
              Accept to join this deal room or reject to decline
            </p>
          </div>
          <div className="flex items-center gap-2">
            {companies.length > 0 && (
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="As company..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No company</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResponse("reject")}
              disabled={responding}
            >
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => handleResponse("accept")}
              disabled={responding}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Accept
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommissionManager({
  dealId,
  parties,
  commissionPool,
  dealValue,
  currency,
  onUpdate,
}: {
  dealId: string;
  parties: DealFull["parties"];
  commissionPool: number;
  dealValue: number;
  currency: string;
  onUpdate: () => void;
}) {
  const [selectedParty, setSelectedParty] = useState("");
  const [pct, setPct] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const agreedPct = parseFloat(pct) / 100;

    const res = await fetch(`/api/deals/${dealId}/commission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId: selectedParty, agreedPct }),
    });

    if (res.ok) {
      toast.success("Commission updated");
      setPct("");
      setSelectedParty("");
      onUpdate();
    } else {
      const data = await res.json();
      setError(data.error);
      toast.error(data.error || "Failed to set commission");
    }

    setSaving(false);
  }

  const poolAmount = dealValue * commissionPool;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Set Commission
        </CardTitle>
        <CardDescription>
          Pool: {(commissionPool * 100).toFixed(2)}% = {currency} {poolAmount.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Party</Label>
            <Select value={selectedParty} onValueChange={setSelectedParty}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select party" />
              </SelectTrigger>
              <SelectContent>
                {parties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.user.name} ({PARTY_ROLE_LABELS[p.role]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Commission %</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max={(commissionPool * 100).toFixed(2)}
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              placeholder="e.g. 0.50"
              className="w-28"
              required
            />
          </div>
          {pct && (
            <p className="text-sm text-muted-foreground pb-2">
              = {currency} {(dealValue * (parseFloat(pct) / 100 || 0)).toLocaleString()}
            </p>
          )}
          <Button type="submit" disabled={saving || !selectedParty}>
            {saving ? "Saving..." : "Set Commission"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DocumentPreview({
  documents,
}: {
  documents: DealFull["documents"];
}) {
  const [previewDoc, setPreviewDoc] = useState<DealFull["documents"][0] | null>(null);

  function canPreview(doc: DealFull["documents"][0]) {
    return doc.mimeType?.startsWith("image/") || doc.mimeType === "application/pdf";
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-8 text-muted-foreground">
          <FileUp className="h-8 w-8 mb-2" />
          <p className="text-sm">No documents uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-background rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium text-sm truncate">{previewDoc.name}</h3>
              <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-60px)]">
              {previewDoc.mimeType?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/documents/${previewDoc.id}`}
                  alt={previewDoc.name}
                  className="max-w-full h-auto mx-auto rounded"
                />
              ) : previewDoc.mimeType === "application/pdf" ? (
                <iframe
                  src={`/api/documents/${previewDoc.id}`}
                  className="w-full h-[75vh] rounded"
                  title={previewDoc.name}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>SHA-256</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{doc.type}</Badge>
                </TableCell>
                <TableCell>
                  {(doc.fileSize / 1024).toFixed(1)} KB
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span title={doc.sha256Hash}>
                    {doc.sha256Hash.slice(0, 12)}...
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{doc.visibility}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(doc.createdAt).toLocaleDateString()}
                  <br />
                  <span className="text-xs">by {doc.uploader.name}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {canPreview(doc) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewDoc(doc)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = `/api/documents/${doc.id}?download`;
                        link.download = doc.name;
                        link.click();
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function MessageSender({
  dealId,
  onSend,
}: {
  dealId: string;
  onSend: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"deal" | "side" | "private">("deal");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);

    await fetch(`/api/deals/${dealId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, visibility }),
    });

    setContent("");
    onSend();
    setSending(false);
  }

  return (
    <form onSubmit={handleSend} className="space-y-2">
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          rows={2}
          className="flex-1"
        />
        <Button type="submit" disabled={sending} size="icon" className="h-auto">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Visibility:</span>
        <div className="flex gap-1">
          {(["deal", "side", "private"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                visibility === v
                  ? v === "deal"
                    ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300"
                    : v === "side"
                    ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900 dark:border-amber-700 dark:text-amber-300"
                    : "bg-red-100 border-red-300 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300"
                  : "bg-muted border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {v === "deal" ? "All Parties" : v === "side" ? "My Side Only" : "Private"}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
