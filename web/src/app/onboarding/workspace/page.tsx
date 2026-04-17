"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

type WorkspaceRow = {
  workspace_id: string;
  role: "owner" | "admin" | "member";
  workspace_name: string | null;
};

const STORAGE_KEY = "polaris.currentWorkspaceId";

export default function WorkspaceOnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSelectingId, setIsSelectingId] = useState<string | null>(null);
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

      const { data: memberships, error: membershipsError } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .order("created_at", { ascending: true });

      if (cancelled) {
        return;
      }

      if (membershipsError) {
        setErrorMessage(getAuthErrorMessage(membershipsError.message));
        setIsLoading(false);
        return;
      }

      const workspaceIds = (memberships ?? []).map((item) =>
        String(item.workspace_id)
      );
      const workspaceNameById = new Map<string, string>();

      if (workspaceIds.length > 0) {
        const { data: workspaces, error: workspacesError } = await supabase
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

        (workspaces ?? []).forEach((workspace) => {
          workspaceNameById.set(String(workspace.id), String(workspace.name));
        });
      }

      const normalized: WorkspaceRow[] = [];
      const seenWorkspaceIds = new Set<string>();
      for (const item of memberships ?? []) {
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

    const { data, error } = await supabase.rpc("create_workspace_with_owner", {
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

    localStorage.setItem(STORAGE_KEY, workspaceId);
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
    localStorage.setItem(STORAGE_KEY, workspaceId);
    router.replace("/dashboard");
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
                    <p className="text-xs uppercase tracking-wide text-(--text-muted)">
                      Perfil: {item.role}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    disabled={isSelectingId === item.workspace_id}
                    onClick={() => handleSelectWorkspace(item.workspace_id)}
                  >
                    {isSelectingId === item.workspace_id
                      ? "Entrando..."
                      : "Selecionar"}
                  </Button>
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
