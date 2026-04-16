Deno.serve(async () => {
  const provider = Deno.env.get("LLM_PROVIDER");
  const model = Deno.env.get("LLM_MODEL");
  const hasApiKey = Boolean(Deno.env.get("LLM_API_KEY"));

  if (!provider || !model || !hasApiKey) {
    return new Response(
      JSON.stringify({
        error: "missing_llm_secrets",
        detail:
          "Defina LLM_PROVIDER, LLM_MODEL e LLM_API_KEY (secrets no projeto Supabase ou ambiente local).",
      }),
      {
        status: 503,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      provider,
      model,
      message:
        "Stub de Edge Function: montagem do prompt com campos do lead e chamada ao provedor virá aqui.",
    }),
    { headers: { "content-type": "application/json; charset=utf-8" } }
  );
});
