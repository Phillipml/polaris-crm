"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useResolvedWorkspaceId } from "@/hooks/use-resolved-workspace-id";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { workspaceRoleLabel } from "@/lib/workspaces/workspace-role-label";

type MemberRow = {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
};

type InviteRow = {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  created_at: string;
};

type BasicMember = {
  user_id: string;
  role: string;
  created_at: string;
};

type RpcClient = {
  rpc: (
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export default function WorkspaceMembersSettingsPage() {
  const { workspaceId } = useResolvedWorkspaceId();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [directory, setDirectory] = useState<MemberRow[]>([]);
  const [basicMembers, setBasicMembers] = useState<BasicMember[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [removingInviteId, setRemovingInviteId] = useState<string | null>(null);

  useEffect(() => {
    async function checkRole() {
      if (!workspaceId) {
        setIsCheckingRole(false);
        setIsAdmin(false);
        setCurrentUserId(null);
        return;
      }
      setIsCheckingRole(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id ?? null;
        setCurrentUserId(userId);
        if (!userId) {
          setIsAdmin(false);
          return;
        }
        const { data, error } = await supabase
          .from("workspace_members")
          .select("role")
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId)
          .single();
        const member = data as { role: "owner" | "admin" | "member" } | null;
        if (error || !member) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(member.role === "owner" || member.role === "admin");
      } finally {
        setIsCheckingRole(false);
      }
    }
    void checkRole();
  }, [workspaceId]);

  const loadLists = useCallback(async () => {
    if (!workspaceId) {
      return;
    }
    setIsLoadingLists(true);
    setErrorMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const rpcClient = supabase as unknown as RpcClient;
      if (isAdmin) {
        const dirRes = await rpcClient.rpc("list_workspace_members_directory", {
          p_workspace: workspaceId,
        });
        if (dirRes.error) {
          throw new Error(dirRes.error.message);
        }
        setDirectory(dedupeByUserId(parseJsonArray<MemberRow>(dirRes.data)));

        const invRes = await supabase
          .from("workspace_invites")
          .select("id, email, role, token, expires_at, created_at")
          .eq("workspace_id", workspaceId)
          .is("accepted_at", null)
          .order("created_at", { ascending: false });
        if (invRes.error) {
          throw new Error(invRes.error.message);
        }
        setInvites((invRes.data ?? []) as InviteRow[]);
        setBasicMembers([]);
      } else {
        const memRes = await supabase
          .from("workspace_members")
          .select("user_id, role, created_at")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: true });
        if (memRes.error) {
          throw new Error(memRes.error.message);
        }
        setBasicMembers(
          dedupeByUserId((memRes.data ?? []) as BasicMember[])
        );
        setDirectory([]);
        setInvites([]);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Não foi possível carregar dados."
      );
    } finally {
      setIsLoadingLists(false);
    }
  }, [workspaceId, isAdmin]);

  useEffect(() => {
    if (!workspaceId || isCheckingRole) {
      return;
    }
    void loadLists();
  }, [workspaceId, isCheckingRole, isAdmin, loadLists]);

  async function handleSendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId) {
      return;
    }
    const trimmed = inviteEmail.trim().toLowerCase();
    if (!trimmed) {
      setErrorMessage("Informe o e-mail do convidado.");
      return;
    }
    setIsSendingInvite(true);
    setErrorMessage(null);
    setFeedback(null);
    setLastInviteUrl(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const rpcClient = supabase as unknown as RpcClient;
      const { data, error } = await rpcClient.rpc("create_workspace_invite", {
        p_workspace_id: workspaceId,
        p_email: trimmed,
        p_role: inviteRole,
      });
      if (error) {
        throw new Error(mapCreateInviteRpcError(error.message));
      }
      const row = data as { token?: string } | null;
      if (!row?.token) {
        throw new Error("Resposta inválida ao criar convite.");
      }
      const url = `${window.location.origin}/accept-invite?token=${encodeURIComponent(row.token)}`;
      setLastInviteUrl(url);
      setFeedback("Convite criado. Envie o link abaixo ao convidado.");
      setInviteEmail("");
      await loadLists();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Não foi possível criar o convite."
      );
    } finally {
      setIsSendingInvite(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!workspaceId) {
      return;
    }
    if (!window.confirm("Remover este membro do workspace?")) {
      return;
    }
    setRemovingUserId(userId);
    setErrorMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId);
      if (error) {
        throw new Error(error.message);
      }
      setFeedback("Membro removido.");
      await loadLists();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Não foi possível remover o membro."
      );
    } finally {
      setRemovingUserId(null);
    }
  }

  async function handleRevokeInvite(id: string) {
    if (!workspaceId) {
      return;
    }
    setRemovingInviteId(id);
    setErrorMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("workspace_invites")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspaceId);
      if (error) {
        throw new Error(error.message);
      }
      setFeedback("Convite revogado.");
      await loadLists();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Não foi possível revogar o convite."
      );
    } finally {
      setRemovingInviteId(null);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("Link copiado.");
    } catch {
      setErrorMessage("Não foi possível copiar. Copie manualmente.");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Card
          title="Membros e convites"
          description="Administradores enviam convites por link. Membros comuns não alteram a equipe."
        >
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-(--primary) hover:underline"
            >
              ← Voltar ao dashboard
            </Link>
          </div>

          {!workspaceId ? (
            <p className="text-sm text-(--text-muted)">
              Selecione um workspace no onboarding.
            </p>
          ) : null}

          {workspaceId && isCheckingRole ? (
            <p className="text-sm text-(--text-muted)">Verificando permissões...</p>
          ) : null}

          {workspaceId && !isCheckingRole && !isAdmin ? (
            <div className="space-y-4">
              <p className="text-sm text-(--text-muted)">
                Apenas administradores do workspace enviam convites e removem
                membros. Aqui você vê a lista de participantes.
              </p>
              {isLoadingLists ? (
                <p className="text-sm text-(--text-muted)">Carregando...</p>
              ) : (
                <ul className="divide-y divide-(--border) rounded-xl border border-(--border) bg-surface">
                  {basicMembers.map((row) => (
                    <li
                      key={row.user_id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                    >
                      <span className="font-mono text-xs text-(--text-muted)">
                        {row.user_id.slice(0, 8)}…
                      </span>
                      <span className="font-medium text-text">
                        {workspaceRoleLabel(row.role)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {workspaceId && !isCheckingRole && isAdmin ? (
            <div className="space-y-8">
              <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto]" onSubmit={handleSendInvite}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="E-mail do convidado"
                  required
                  className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25 sm:col-span-1"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                  className="rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                >
                  <option value="member">Membro</option>
                  <option value="admin">Administrador</option>
                </select>
                <Button type="submit" disabled={isSendingInvite}>
                  {isSendingInvite ? "Enviando..." : "Criar convite"}
                </Button>
              </form>

              {lastInviteUrl ? (
                <div className="rounded-xl border border-(--border) bg-(--surface-hover)/30 p-4">
                  <p className="text-xs font-medium text-(--text-muted)">Link do convite</p>
                  <p className="mt-2 break-all text-sm text-text">{lastInviteUrl}</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3"
                    onClick={() => void copyText(lastInviteUrl)}
                  >
                    Copiar link
                  </Button>
                </div>
              ) : null}

              <div aria-live="polite" className="min-h-6">
                {errorMessage ? (
                  <p className="text-sm font-medium text-red-500">{errorMessage}</p>
                ) : null}
                {!errorMessage && feedback ? (
                  <p className="text-sm font-medium text-emerald-600">{feedback}</p>
                ) : null}
              </div>

              <section>
                <h2 className="text-sm font-semibold text-text">Membros</h2>
                {isLoadingLists ? (
                  <p className="mt-2 text-sm text-(--text-muted)">Carregando...</p>
                ) : (
                  <ul className="mt-3 divide-y divide-(--border) rounded-xl border border-(--border) bg-surface">
                    {directory.map((row) => (
                      <li
                        key={row.user_id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-text">{row.email}</p>
                          <p className="text-xs text-(--text-muted)">
                            {workspaceRoleLabel(row.role)}
                          </p>
                        </div>
                        {row.user_id !== currentUserId && row.role !== "owner" ? (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={removingUserId === row.user_id}
                            onClick={() => void handleRemoveMember(row.user_id)}
                          >
                            {removingUserId === row.user_id ? "Removendo..." : "Remover"}
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="text-sm font-semibold text-text">Convites pendentes</h2>
                {isLoadingLists ? (
                  <p className="mt-2 text-sm text-(--text-muted)">Carregando...</p>
                ) : invites.length === 0 ? (
                  <p className="mt-2 text-sm text-(--text-muted)">Nenhum convite pendente.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-(--border) rounded-xl border border-(--border) bg-surface">
                    {invites.map((row) => (
                        <li
                          key={row.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                        >
                          <div>
                            <p className="font-medium text-text">{row.email}</p>
                            <p className="text-xs text-(--text-muted)">
                              {workspaceRoleLabel(row.role)} · expira{" "}
                              {new Date(row.expires_at).toLocaleString("pt-BR")}
                            </p>
                            <button
                              type="button"
                              className="mt-1 text-xs font-medium text-(--primary) hover:underline"
                              onClick={() => {
                                const link = `${window.location.origin}/accept-invite?token=${encodeURIComponent(row.token)}`;
                                void copyText(link);
                              }}
                            >
                              Copiar link
                            </button>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={removingInviteId === row.id}
                            onClick={() => void handleRevokeInvite(row.id)}
                          >
                            {removingInviteId === row.id ? "Revogando..." : "Revogar"}
                          </Button>
                        </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}

function dedupeByUserId<T extends { user_id: string }>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of rows) {
    map.set(row.user_id, row);
  }
  return [...map.values()];
}

function parseJsonArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) {
    return raw as T[];
  }
  if (typeof raw === "string") {
    try {
      const value = JSON.parse(raw) as unknown;
      return Array.isArray(value) ? (value as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapCreateInviteRpcError(message: string): string {
  if (message.includes("create_workspace_invite_forbidden")) {
    return "Sem permissão para convidar neste workspace.";
  }
  if (message.includes("create_workspace_invite_email_required")) {
    return "E-mail obrigatório.";
  }
  if (message.includes("create_workspace_invite_invalid_role")) {
    return "Função do convite inválida.";
  }
  if (message.includes("create_workspace_invite_already_member")) {
    return "Este e-mail já é membro do workspace.";
  }
  if (message.includes("idx_workspace_invites_pending_workspace_email")) {
    return "Já existe convite pendente para este e-mail.";
  }
  return message;
}
