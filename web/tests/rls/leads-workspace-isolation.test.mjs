import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_TEST_URL ?? "http://127.0.0.1:54321";
const publishableKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_TEST_SECRET_KEY;
const password = process.env.SUPABASE_TEST_PASSWORD ?? "Polaris@Test123!";

test(
  "usuario A nao lista leads do workspace de B mesmo conhecendo UUIDs",
  { timeout: 30000 },
  async (t) => {
    if (!publishableKey || !secretKey) {
      t.skip(
        "Defina SUPABASE_TEST_PUBLISHABLE_KEY e SUPABASE_TEST_SECRET_KEY para rodar o teste."
      );
      return;
    }

    const admin = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const userAEmail = `rls-a-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const userBEmail = `rls-b-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

    const createdUserIds = [];
    const createdWorkspaceIds = [];

    t.after(async () => {
      if (createdWorkspaceIds.length > 0) {
        await admin.from("workspaces").delete().in("id", createdWorkspaceIds);
      }

      for (const userId of createdUserIds) {
        await admin.auth.admin.deleteUser(userId);
      }
    });

    const userA = await admin.auth.admin.createUser({
      email: userAEmail,
      password,
      email_confirm: true,
    });
    assert.equal(userA.error, null);
    assert.ok(userA.data.user?.id);
    createdUserIds.push(userA.data.user.id);

    const userB = await admin.auth.admin.createUser({
      email: userBEmail,
      password,
      email_confirm: true,
    });
    assert.equal(userB.error, null);
    assert.ok(userB.data.user?.id);
    createdUserIds.push(userB.data.user.id);

    const clientA = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const clientB = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const signInA = await clientA.auth.signInWithPassword({
      email: userAEmail,
      password,
    });
    assert.equal(signInA.error, null);

    const signInB = await clientB.auth.signInWithPassword({
      email: userBEmail,
      password,
    });
    assert.equal(signInB.error, null);

    const workspaceA = await clientA.rpc("create_workspace_with_owner", {
      workspace_name: `Workspace A ${Date.now()}`,
    });
    assert.equal(workspaceA.error, null);
    assert.ok(workspaceA.data);
    createdWorkspaceIds.push(workspaceA.data);

    const workspaceB = await clientB.rpc("create_workspace_with_owner", {
      workspace_name: `Workspace B ${Date.now()}`,
    });
    assert.equal(workspaceB.error, null);
    assert.ok(workspaceB.data);
    createdWorkspaceIds.push(workspaceB.data);

    const baseStage = await clientB
      .from("funnel_stages")
      .select("id")
      .eq("workspace_id", workspaceB.data)
      .eq("name", "Base")
      .single();

    assert.equal(baseStage.error, null);
    assert.ok(baseStage.data?.id);

    const leadInsert = await clientB
      .from("leads")
      .insert({
        workspace_id: workspaceB.data,
        stage_id: baseStage.data.id,
        full_name: "Lead do workspace B",
        email: `lead-${Date.now()}@example.com`,
      })
      .select("id, workspace_id")
      .single();

    assert.equal(leadInsert.error, null);
    assert.ok(leadInsert.data?.id);

    const ownerCanRead = await clientB
      .from("leads")
      .select("id, workspace_id")
      .eq("workspace_id", workspaceB.data)
      .eq("id", leadInsert.data.id);

    assert.equal(ownerCanRead.error, null);
    assert.equal(ownerCanRead.data.length, 1);
    assert.equal(ownerCanRead.data[0].id, leadInsert.data.id);

    const otherUserCannotList = await clientA
      .from("leads")
      .select("id, workspace_id")
      .eq("workspace_id", workspaceB.data)
      .eq("id", leadInsert.data.id);

    assert.equal(otherUserCannotList.error, null);
    assert.deepEqual(otherUserCannotList.data, []);
  }
);
