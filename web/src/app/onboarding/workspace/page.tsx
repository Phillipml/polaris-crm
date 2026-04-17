"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { WORKSPACE_STORAGE_KEY } from "@/hooks/use-resolved-workspace-id";
import { workspaceRoleLabel } from "@/lib/workspaces/workspace-role-label";

type WorkspaceRow = {
  workspace_id: string;
  role: "owner" | "admin" | "member";
  workspace_name: string | null;
};

type RpcClient = {
  rpc: (
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export default function WorkspaceOnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSelectingId, setIsSelectingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const userId = sessionData.session.user.id;
      const { data: membershipsRaw, error: membershipsError } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (cancelled) {
        return;
      }

      if (membershipsError) {
        setErrorMessage(getAuthErrorMessage(membershipsError.message));
        setIsLoading(false);
        return;
      }

      const memberships = (membershipsRaw ?? []) as Array<{
        workspace_id: string;
        role: WorkspaceRow["role"];
      }>;

      const workspaceIds = memberships.map((item) =>
        String(item.workspace_id)
      );
      const workspaceNameById = new Map<string, string>();

      if (workspaceIds.length > 0) {
        const { data: workspacesRaw, error: workspacesError } = await supabase
          .from("workspaces")
          .select("id, name")
          .in("id", workspaceIds);

        if (cancelled) {
          return;
        }

        if (workspacesError) {
          setErrorMessage(getAuthErrorMessage(workspacesError.message));
          setIsLoading(false);
          return;
        }

        const workspaces = (workspacesRaw ?? []) as Array<{
          id: string;
          name: string;
        }>;

        workspaces.forEach((workspace) => {
          workspaceNameById.set(String(workspace.id), String(workspace.name));
        });
      }

      const normalized: WorkspaceRow[] = [];
      const seenWorkspaceIds = new Set<string>();
      for (const item of memberships) {
        const wid = String(item.workspace_id);
        if (seenWorkspaceIds.has(wid)) {
          continue;
        }
        seenWorkspaceIds.add(wid);
        normalized.push({
          workspace_id: wid,
          role: item.role as WorkspaceRow["role"],
          workspace_name: workspaceNameById.get(wid) ?? null,
        });
      }

      setWorkspaces(normalized);
      setIsLoading(false);
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = workspaceName.trim();
    if (!trimmedName) {
      setErrorMessage("Informe o nome do workspace.");
      return;
    }

    setErrorMessage("");
    setInfoMessage("");
    setIsCreating(true);
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setIsCreating(false);
      setErrorMessage(
        "Sua sessão expirou. Faça login novamente para criar o workspace."
      );
      router.replace("/login");
      return;
    }

    const rpcClient = supabase as unknown as RpcClient;
    const { data, error } = await rpcClient.rpc("create_workspace_with_owner", {
      workspace_name: trimmedName,
    });

    if (error) {
      setIsCreating(false);
      setErrorMessage(getAuthErrorMessage(error.message));
      return;
    }

    const workspaceId = String(data ?? "");
    if (!workspaceId) {
      setIsCreating(false);
      setErrorMessage("Não foi possível criar o workspace.");
      return;
    }

    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
    const newWorkspace: WorkspaceRow = {
      workspace_id: workspaceId,
      role: "owner",
      workspace_name: trimmedName,
    };
    setWorkspaces((current) => {
      const filtered = current.filter(
        (item) => item.workspace_id !== workspaceId
      );
      return [...filtered, newWorkspace];
    });
    setWorkspaceName("");
    setInfoMessage(
      "Workspace criado com sucesso. Selecione-o na lista para continuar."
    );
    setIsCreating(false);
  }

  function handleSelectWorkspace(workspaceId: string) {
    setErrorMessage("");
    setInfoMessage("");
    setIsSelectingId(workspaceId);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
    router.replace("/dashboard");
  }

  async function handleDeleteWorkspace(item: WorkspaceRow) {
    if (item.role !== "owner") {
      setErrorMessage("Apenas o administrador do workspace pode apagar.");
      return;
    }

    const approved = window.confirm(
      `Tem certeza que deseja apagar o workspace "${item.workspace_name ?? "sem nome"}"? Esta ação remove leads, etapas e campanhas relacionadas.`
    );
    if (!approved) {
      return;
    }

    setErrorMessage("");
    setInfoMessage("");
    setIsDeletingId(item.workspace_id);

    try {
      const supabase = getSupabaseBrowserClient();
      const rpcClient = supabase as unknown as RpcClient;
      const { error } = await rpcClient.rpc("delete_workspace_as_owner", {
        p_workspace_id: item.workspace_id,
      });
      if (error) {
        const normalizedError = error.message.toLowerCase();
        if (
          normalizedError.includes("function public.delete_workspace_as_owner") &&
          normalizedError.includes("does not exist")
        ) {
          setErrorMessage(
            "Não foi possível apagar porque a função ainda não existe no banco local. Rode as migrações do Supabase."
          );
          return;
        }
        setErrorMessage(getAuthErrorMessage(error.message));
        return;
      }

      setWorkspaces((current) =>
        current.filter((workspace) => workspace.workspace_id !== item.workspace_id)
      );

      const selectedWorkspaceId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (selectedWorkspaceId === item.workspace_id) {
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }
      setInfoMessage("Workspace removido com sucesso.");
    } finally {
      setIsDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-bg-base px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-center">
          <Link href="/" aria-label="Voltar para home">
            <Image
              src="/logoFull.svg"
              alt="PolarisCRM"
              width={172}
              height={36}
              priority
            />
          </Link>
        </div>

        <section className="rounded-2xl border border-(--border) bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Escolha seu workspace
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-(--text-muted)">
            Crie seu primeiro workspace ou selecione um existente para entrar no
            dashboard.
          </p>

          {isLoading ? (
            <p className="mt-6 text-sm text-(--text-muted)">Carregando...</p>
          ) : null}

          {!isLoading && workspaces.length > 0 ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium text-text">Seus workspaces</p>
              {workspaces.map((item) => (
                <div
                  key={item.workspace_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-(--border) bg-(--surface-hover)/40 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {item.workspace_name ?? "Workspace sem nome"}
                    </p>
                    <p className="text-xs tracking-wide text-(--text-muted)">
                      Perfil: {workspaceRoleLabel(item.role)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      disabled={
                        isSelectingId === item.workspace_id ||
                        isDeletingId === item.workspace_id
                      }
                      onClick={() => handleSelectWorkspace(item.workspace_id)}
                      className="px-3 py-2 text-xs"
                    >
                      {isSelectingId === item.workspace_id
                        ? "Entrando..."
                        : "Selecionar"}
                    </Button>
                    {item.role === "owner" ? (
                      <Button
                        variant="secondary"
                        disabled={isDeletingId === item.workspace_id}
                        onClick={() => void handleDeleteWorkspace(item)}
                        className="border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-700 hover:bg-red-500/20 dark:text-red-300"
                      >
                        {isDeletingId === item.workspace_id
                          ? "Apagando..."
                          : "Apagar"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <form
            className="mt-6 space-y-4"
            onSubmit={handleCreateWorkspace}
            noValidate
          >
            <div className="space-y-1.5">
              <label htmlFor="workspaceName" className="text-sm font-medium">
                Novo workspace
              </label>
              <input
                id="workspaceName"
                name="workspaceName"
                type="text"
                required
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder="Ex.: Vendas SMB Brasil"
                className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
              />
            </div>

            <div aria-live="polite" className="min-h-5">
              {errorMessage ? (
                <p role="alert" className="text-sm font-medium text-red-500">
                  {errorMessage}
                </p>
              ) : null}
              {!errorMessage && infoMessage ? (
                <p className="text-sm font-medium text-emerald-600">
                  {infoMessage}
                </p>
              ) : null}
            </div>

            <Button type="submit" disabled={isCreating || isLoading}>
              {isCreating ? "Criando..." : "Criar workspace"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
