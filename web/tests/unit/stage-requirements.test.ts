import { humanizeMissingRequirementToken } from "@/lib/stage-required-fields/lead-field-labels";
import {
  formatMissingRequirementsMessage,
  listMissingStageRequirements,
  type LeadSnapshotForRequirements,
} from "@/lib/stage-required-fields/validate-lead-for-stage-requirements";
import type { StageRequiredField } from "@/lib/stage-required-fields/stage-required-fields-service";

const snapshotBase: LeadSnapshotForRequirements = {
  full_name: "Ana",
  company_name: "Acme",
  email: "ana@acme.com",
  phone: null,
  job_title: null,
  linkedin_url: null,
  source: null,
  status: null,
  notes: null,
  owner_user_id: null,
  custom_fields: {},
};

function req(
  field_kind: StageRequiredField["field_kind"],
  field_key: string
): StageRequiredField {
  return {
    id: "id-1",
    stage_id: "stage-1",
    field_kind,
    field_key,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe("stage required fields", () => {
  it("detecta campos padrão e custom faltando", () => {
    const missing = listMissingStageRequirements(
      [req("standard", "owner_user_id"), req("custom", "segmento")],
      snapshotBase
    );
    expect(missing).toEqual(["standard:owner_user_id", "custom:segmento"]);
  });

  it("considera custom preenchido com boolean e number", () => {
    const missing = listMissingStageRequirements(
      [req("custom", "ativo"), req("custom", "score")],
      {
        ...snapshotBase,
        custom_fields: { ativo: false, score: 10 },
      }
    );
    expect(missing).toEqual([]);
  });

  it("trata campo padrão owner_user_id preenchido", () => {
    const missing = listMissingStageRequirements(
      [req("standard", "owner_user_id")],
      {
        ...snapshotBase,
        owner_user_id: "user-1",
      }
    );
    expect(missing).toEqual([]);
  });

  it("trata campo padrão conhecido vazio e preenchido", () => {
    const missingWhenEmpty = listMissingStageRequirements(
      [req("standard", "phone")],
      {
        ...snapshotBase,
        phone: " ",
      }
    );
    const missingWhenFilled = listMissingStageRequirements(
      [req("standard", "phone")],
      {
        ...snapshotBase,
        phone: "1199999999",
      }
    );
    expect(missingWhenEmpty).toEqual(["standard:phone"]);
    expect(missingWhenFilled).toEqual([]);
  });

  it("marca como faltante chave padrão desconhecida e kind inválido", () => {
    const missing = listMissingStageRequirements(
      [
        req("standard", "campo_desconhecido"),
        { ...req("standard", "status"), field_kind: "x" as "standard" },
      ],
      snapshotBase
    );
    expect(missing).toEqual(["standard:campo_desconhecido", "x:status"]);
  });

  it("trata custom faltando quando inexistente, null e string vazia", () => {
    const reqs = [req("custom", "segmento")];
    expect(listMissingStageRequirements(reqs, snapshotBase)).toEqual([
      "custom:segmento",
    ]);
    expect(
      listMissingStageRequirements(reqs, {
        ...snapshotBase,
        custom_fields: { segmento: null },
      })
    ).toEqual(["custom:segmento"]);
    expect(
      listMissingStageRequirements(reqs, {
        ...snapshotBase,
        custom_fields: { segmento: "   " },
      })
    ).toEqual(["custom:segmento"]);
  });

  it("trata custom com objeto como preenchido", () => {
    const missing = listMissingStageRequirements([req("custom", "meta")], {
      ...snapshotBase,
      custom_fields: { meta: { a: 1 } },
    });
    expect(missing).toEqual([]);
  });

  it("trata custom com tipo não suportado como faltante", () => {
    const missing = listMissingStageRequirements([req("custom", "payload")], {
      ...snapshotBase,
      custom_fields: { payload: Symbol("x") as unknown as string },
    });
    expect(missing).toEqual(["custom:payload"]);
  });

  it("humaniza token padrão e custom", () => {
    expect(humanizeMissingRequirementToken("standard:full_name")).toBe("Nome");
    expect(
      humanizeMissingRequirementToken("custom:segmento", { segmento: "Segmento" })
    ).toBe("Segmento");
  });

  it("monta mensagem de campos faltando", () => {
    const message = formatMissingRequirementsMessage(
      ["standard:email", "custom:segmento"],
      { segmento: "Segmento" }
    );
    expect(message).toBe("Campos obrigatórios faltando: E-mail, Segmento");
  });

  it("retorna mensagem vazia quando não há faltantes", () => {
    expect(formatMissingRequirementsMessage([])).toBe("");
  });

  it("humaniza token inválido sem separador", () => {
    expect(humanizeMissingRequirementToken("token_invalido")).toBe(
      "token_invalido"
    );
  });

  it("humaniza token com kind desconhecido", () => {
    expect(humanizeMissingRequirementToken("other:campo")).toBe("other:campo");
  });
});
