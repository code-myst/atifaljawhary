"use client";

import { PaymentMethod, newId } from "@/lib/settingsTypes";

export default function PaymentMethodsEditor({
  value,
  onChange,
}: {
  value: PaymentMethod[];
  onChange: (next: PaymentMethod[]) => void;
}) {
  function updateMethod(id: string, patch: Partial<PaymentMethod>) {
    onChange(value.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function addMethod() {
    onChange([
      ...value,
      {
        id: newId(),
        name: "",
        number: "",
        instructions: "",
        fields: [{ id: newId(), label: "Transaction ID", required: true }],
      },
    ]);
  }

  function removeMethod(id: string) {
    if (!window.confirm("Remove this payment method?")) return;
    onChange(value.filter((m) => m.id !== id));
  }

  function addField(methodId: string) {
    onChange(
      value.map((m) =>
        m.id === methodId
          ? {
              ...m,
              fields: [...m.fields, { id: newId(), label: "", required: false }],
            }
          : m
      )
    );
  }

  function updateField(
    methodId: string,
    fieldId: string,
    patch: Partial<{ label: string; required: boolean }>
  ) {
    onChange(
      value.map((m) =>
        m.id === methodId
          ? {
              ...m,
              fields: m.fields.map((f) =>
                f.id === fieldId ? { ...f, ...patch } : f
              ),
            }
          : m
      )
    );
  }

  function removeField(methodId: string, fieldId: string) {
    onChange(
      value.map((m) =>
        m.id === methodId
          ? { ...m, fields: m.fields.filter((f) => f.id !== fieldId) }
          : m
      )
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {value.map((m) => (
        <div key={m.id} className="rounded border p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={m.name}
              onChange={(e) => updateMethod(m.id, { name: e.target.value })}
              placeholder="Method name (e.g. bKash)"
              className="rounded border p-2 text-base"
            />
            <input
              value={m.number}
              onChange={(e) => updateMethod(m.id, { number: e.target.value })}
              placeholder="Phone / account number"
              className="rounded border p-2 text-base"
            />
            <textarea
              value={m.instructions}
              onChange={(e) =>
                updateMethod(m.id, { instructions: e.target.value })
              }
              placeholder="Instructions for the customer"
              rows={3}
              className="rounded border p-2 text-base sm:col-span-2"
            />
          </div>

          <p className="mb-1 mt-3 text-xs text-gray-500">
            Form fields the customer fills in
          </p>
          <div className="flex flex-col gap-2">
            {m.fields.map((f) => (
              <div key={f.id} className="flex items-center gap-2">
                <input
                  value={f.label}
                  onChange={(e) =>
                    updateField(m.id, f.id, { label: e.target.value })
                  }
                  placeholder="Field label (e.g. Sender number)"
                  className="min-w-0 flex-1 rounded border p-2 text-base"
                />
                <label className="flex shrink-0 items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={f.required}
                    onChange={(e) =>
                      updateField(m.id, f.id, { required: e.target.checked })
                    }
                  />
                  Required
                </label>
                <button
                  type="button"
                  onClick={() => removeField(m.id, f.id)}
                  className="shrink-0 rounded border px-2 py-1 text-xs text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => addField(m.id)}
              className="rounded border px-3 py-1 text-xs"
            >
              + Add field
            </button>
            <button
              type="button"
              onClick={() => removeMethod(m.id)}
              className="rounded border px-3 py-1 text-xs text-red-600"
            >
              Remove method
            </button>
          </div>
        </div>
      ))}

      {value.length === 0 && (
        <p className="text-sm text-gray-500">No payment methods yet.</p>
      )}

      <button
        type="button"
        onClick={addMethod}
        disabled={value.length >= 6}
        className="w-fit rounded border px-3 py-1 text-sm disabled:opacity-50"
      >
        + Add payment method
      </button>
    </div>
  );
}