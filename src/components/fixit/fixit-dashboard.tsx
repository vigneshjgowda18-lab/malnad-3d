import { useMemo, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Compass,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  MapPin,
  Megaphone,
  Plus,
  Presentation,
  Search,
  ShieldCheck,
  Tag,
  Ticket as TicketIcon,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/auth/auth-layout";
import {
  clearSession,
  getSession,
  setSession,
  type AuthSession,
  type DashboardRole,
} from "@/lib/mock-auth";
import {
  computeFixItStats,
  getIssueTypes,
  getTickets,
  isTicketOverdue,
  type Ticket,
  type TicketStatus,
} from "@/lib/fixit-store";
import { RaiseTicketModal } from "./raise-ticket-modal";
import { TicketDetailsModal } from "./ticket-details-modal";
import { UpdateStatusModal } from "./update-status-modal";
import { IssueTypesModal } from "./issue-types-modal";

interface FixItDashboardProps {
  role: DashboardRole;
}

type FilterTab = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "OVERDUE" | "MY_TICKETS";

export function FixItDashboard({ role }: FixItDashboardProps) {
  const navigate = useNavigate();
  const [session, setLocalSession] = useState<AuthSession | null>(getSession());
  const [tickets, setTickets] = useState<Ticket[]>(getTickets());
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [selectedIssueType, setSelectedIssueType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [detailsTicket, setDetailsTicket] = useState<Ticket | null>(null);
  const [statusTicket, setStatusTicket] = useState<Ticket | null>(null);
  const [issueTypesOpen, setIssueTypesOpen] = useState(false);

  // Active nav item
  const [activeNav, setActiveNav] = useState("fixit");

  const currentUser = useMemo(() => {
    return {
      name: session?.name || "Aarav Sharma",
      id: session?.usn || session?.name || "1RV23CS099",
      role: session?.role || role,
    };
  }, [session, role]);

  const isCmOrAdmin = currentUser.role === "admin";
  const issueTypes = getIssueTypes();

  function refreshTickets() {
    setTickets(getTickets());
  }

  function handleLogout() {
    clearSession();
    toast.success("Signed out of CampusOS – FixIt.");
    navigate({ to: "/" });
  }

  function switchRole(newRole: DashboardRole) {
    const updated: AuthSession =
      newRole === "admin"
        ? { name: "Team 42 Admin", usn: null, role: "admin" }
        : newRole === "faculty"
          ? { name: "Dr. Priya Raman", usn: "1RV18CS042", role: "faculty" }
          : { name: "Aarav Sharma", usn: "1RV23CS099", role: "student" };
    setSession(updated);
    setLocalSession(updated);
    toast.info(`Switched view to ${newRole.toUpperCase()}`);
    navigate({ to: "/dashboard/$role", params: { role: newRole } });
  }

  const stats = useMemo(() => {
    return computeFixItStats(tickets, currentUser.id);
  }, [tickets, currentUser.id]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Tab filter
      const overdue = isTicketOverdue(t);
      if (activeTab === "OPEN" && t.status !== "OPEN") return false;
      if (activeTab === "IN_PROGRESS" && t.status !== "IN_PROGRESS") return false;
      if (activeTab === "RESOLVED" && t.status !== "RESOLVED" && t.status !== "ACKNOWLEDGED") return false;
      if (activeTab === "OVERDUE" && !overdue) return false;
      if (activeTab === "MY_TICKETS") {
        const isMine =
          t.created_by.toLowerCase() === currentUser.id.toLowerCase() ||
          t.created_by_name.toLowerCase().includes(currentUser.name.toLowerCase());
        if (!isMine) return false;
      }

      // Issue type filter
      if (selectedIssueType !== "ALL" && t.issue_type_id !== selectedIssueType) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          t.id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.issue_type_name.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [tickets, activeTab, selectedIssueType, searchQuery, currentUser]);

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-400">Open</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400">In Progress</Badge>;
      case "RESOLVED":
        return <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400">Resolved</Badge>;
      case "ACKNOWLEDGED":
        return <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-400">Closed</Badge>;
    }
  };

  const SIDEBAR_ITEMS = [
    { id: "home", label: "Home", icon: Home },
    { id: "findit", label: "FindIt", icon: Compass },
    { id: "notice", label: "Notice Hub", icon: Megaphone },
    { id: "docdesk", label: "DocDesk", icon: FileText },
    { id: "fixit", label: "FixIt", icon: Wrench, active: true },
    { id: "campus3d", label: "3D Campus", icon: Presentation },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* ────────────────────── Left Sidebar ────────────────────── */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <BrandMark />
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {SIDEBAR_ITEMS.map(({ id, label, icon: Icon, active }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveNav(id);
                  if (id === "campus3d") {
                    navigate({ to: "/campus3d" });
                    return;
                  }
                  if (id !== "fixit") {
                    toast.info(`${label} is simulated for CampusOS navigation.`);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  activeNav === id
                    ? "bg-primary/15 text-primary font-semibold shadow-[0_0_18px_-8px_var(--glow)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${activeNav === id ? "text-primary" : "text-muted-foreground"}`} />
                <span>{label}</span>
                {active && (
                  <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary uppercase">
                    Active
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer: Quick Role Switcher for Demo + Logout */}
        <div className="p-3 border-t border-border space-y-2">
          <div className="rounded-xl border border-border/70 bg-secondary/30 p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1">
              <Users className="h-3 w-3" /> Demo Role Switcher
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => switchRole("student")}
                className={`text-[10px] py-1 px-1.5 rounded-md font-medium text-center transition-colors ${
                  currentUser.role === "student"
                    ? "bg-primary text-primary-foreground font-bold"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => switchRole("faculty")}
                className={`text-[10px] py-1 px-1.5 rounded-md font-medium text-center transition-colors ${
                  currentUser.role === "faculty"
                    ? "bg-accent text-accent-foreground font-bold"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => switchRole("admin")}
                className={`text-[10px] py-1 px-1.5 rounded-md font-medium text-center transition-colors ${
                  currentUser.role === "admin"
                    ? "bg-destructive text-destructive-foreground font-bold"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Admin/CM
              </button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* ────────────────────── Main Content Area ────────────────────── */}
      <main className="flex-1 overflow-y-auto max-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header / Welcome Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Welcome, {currentUser.name}!
              </h1>
              <Badge
                variant="outline"
                className={`capitalize text-[11px] font-semibold py-0.5 px-2.5 ${
                  isCmOrAdmin
                    ? "border-destructive/40 bg-destructive/15 text-destructive"
                    : "border-primary/40 bg-primary/15 text-primary"
                }`}
              >
                {isCmOrAdmin ? (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Campus Maintenance & Admin
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    {currentUser.role === "student" ? (
                      <GraduationCap className="h-3 w-3" />
                    ) : (
                      <Presentation className="h-3 w-3" />
                    )}
                    {currentUser.role}
                  </span>
                )}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Report. Track. Resolve. Improve. Follow all campus maintenance requests in real-time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isCmOrAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIssueTypesOpen(true)}
                className="gap-1.5 h-10 border-border hover:border-primary/50 text-xs font-semibold"
              >
                <Tag className="h-3.5 w-3.5 text-primary" /> Manage Issue Types
              </Button>
            )}

            <Button
              onClick={() => setRaiseOpen(true)}
              className="gap-1.5 h-10 font-semibold shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Raise a Ticket
            </Button>
          </div>
        </div>

        {/* ────────────────────── 4 Stat Metric Cards (Matching Wireframe 2) ────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Open Tickets */}
          <button
            type="button"
            onClick={() => setActiveTab("OPEN")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === "OPEN"
                ? "border-blue-500 bg-blue-500/10 shadow-[0_0_24px_-10px_rgba(59,130,246,0.5)]"
                : "border-border bg-card/40 hover:border-blue-500/40 hover:bg-card/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open</span>
              <div className="h-7 w-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <TicketIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
              {stats.open}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Queued or assigned</p>
          </button>

          {/* Resolved Tickets */}
          <button
            type="button"
            onClick={() => setActiveTab("RESOLVED")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === "RESOLVED"
                ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_24px_-10px_rgba(16,185,129,0.5)]"
                : "border-border bg-card/40 hover:border-emerald-500/40 hover:bg-card/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolved</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
              {stats.resolved}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Fixed & closed</p>
          </button>

          {/* My Tickets */}
          <button
            type="button"
            onClick={() => setActiveTab("MY_TICKETS")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === "MY_TICKETS"
                ? "border-primary bg-primary/10 shadow-[0_0_24px_-10px_var(--glow)]"
                : "border-border bg-card/40 hover:border-primary/40 hover:bg-card/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Tickets</span>
              <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <ClipboardList className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
              {stats.myTickets}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Created by you</p>
          </button>

          {/* Overdue */}
          <button
            type="button"
            onClick={() => setActiveTab("OVERDUE")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === "OVERDUE"
                ? "border-destructive bg-destructive/10 shadow-[0_0_24px_-10px_oklch(0.62_0.21_25/0.5)]"
                : "border-border bg-card/40 hover:border-destructive/40 hover:bg-card/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue</span>
              <div className="h-7 w-7 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 font-display text-2xl sm:text-3xl font-bold text-destructive">
              {stats.overdue}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Passed target TAT</p>
          </button>
        </section>

        {/* ────────────────────── Filter Tabs & Search Bar (Matching Wireframe 4) ────────────────────── */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { id: "ALL", label: "All Tickets" },
                  { id: "OPEN", label: "Open" },
                  { id: "IN_PROGRESS", label: "In Progress" },
                  { id: "RESOLVED", label: "Resolved" },
                  { id: "OVERDUE", label: "Overdue" },
                  { id: "MY_TICKETS", label: "My Tickets" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === id
                      ? "bg-secondary text-foreground font-semibold border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Category Dropdown Filter */}
            <div className="flex items-center gap-2">
              <select
                value={selectedIssueType}
                onChange={(e) => setSelectedIssueType(e.target.value)}
                className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Categories</option>
                {issueTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ID (e.g. TK-1024), title, location or keywords..."
              className="h-10 pl-10 text-xs"
            />
          </div>
        </div>

        {/* ────────────────────── Tickets List / Table (Matching Wireframes 2 & 4) ────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
              {activeTab === "MY_TICKETS" ? "My Reported Tickets" : "Campus Maintenance Tickets"} (
              {filteredTickets.length})
            </h2>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/20 p-12 text-center">
              <TicketIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">No tickets match your filter</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try selecting a different tab or clearing your search query.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab("ALL");
                  setSelectedIssueType("ALL");
                  setSearchQuery("");
                }}
                className="mt-4 text-xs"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredTickets.map((ticket) => {
                const overdue = isTicketOverdue(ticket);
                const isReporter =
                  ticket.created_by.toLowerCase() === currentUser.id.toLowerCase() ||
                  ticket.created_by_name.toLowerCase().includes(currentUser.name.toLowerCase());

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setDetailsTicket(ticket)}
                    className="group rounded-2xl border border-border bg-card/40 p-4 transition-all hover:border-primary/40 hover:bg-card/80 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {ticket.photo_url ? (
                        <img
                          src={ticket.photo_url}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-secondary/70 border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                          <Wrench className="h-5 w-5" />
                        </div>
                      )}

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground bg-secondary/80 px-2 py-0.5 rounded-md">
                            {ticket.id}
                          </span>
                          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {ticket.title}
                          </span>
                          {getStatusBadge(ticket.status)}
                          {overdue && (
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5 animate-pulse">
                              Overdue
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-foreground/80">
                            <Tag className="h-3 w-3 text-primary" /> {ticket.issue_type_name}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 text-accent" /> {ticket.location}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {ticket.created_by_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side buttons */}
                    <div
                      className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isReporter && ticket.status === "RESOLVED" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setDetailsTicket(ticket);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Acknowledge
                        </Button>
                      )}

                      {isCmOrAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStatusTicket(ticket)}
                          className="text-xs h-8 gap-1 border-primary/40 text-primary hover:bg-primary/10"
                        >
                          <Wrench className="h-3.5 w-3.5" /> Update Status
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDetailsTicket(ticket)}
                        className="text-xs h-8 text-muted-foreground group-hover:text-foreground"
                      >
                        View <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ────────────────────── Modals ────────────────────── */}
      <RaiseTicketModal
        open={raiseOpen}
        onOpenChange={setRaiseOpen}
        currentUser={currentUser}
        onTicketCreated={() => refreshTickets()}
      />

      <TicketDetailsModal
        ticket={detailsTicket}
        open={!!detailsTicket}
        onOpenChange={(open) => !open && setDetailsTicket(null)}
        currentUser={currentUser}
        onTicketUpdated={() => refreshTickets()}
        onOpenStatusModal={(t) => setStatusTicket(t)}
      />

      <UpdateStatusModal
        ticket={statusTicket}
        open={!!statusTicket}
        onOpenChange={(open) => !open && setStatusTicket(null)}
        onUpdated={() => refreshTickets()}
      />

      <IssueTypesModal
        open={issueTypesOpen}
        onOpenChange={setIssueTypesOpen}
        onTypesUpdated={() => refreshTickets()}
      />
    </div>
  );
}
