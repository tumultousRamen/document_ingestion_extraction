"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export default function BrokersPage() {
  const brokers = api.broker.list.useQuery({ limit: 50 });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Brokers</h1>
      {brokers.data?.length ? (
        <ul className="grid grid-cols-1 gap-2 text-sm text-gray-800">
          {brokers.data.map((b) => (
            <li key={b.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-gray-700">{b.email}</div>
                  <div className="text-gray-700">
                    {[
                      b.streetAddress,
                      b.unitType && `${b.unitType} ${b.unitNumber}`,
                      b.cityTown,
                      b.state,
                      b.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                  {b.properties?.length ? (
                    <div className="mt-1 text-xs text-gray-600">
                      {b.properties.length} properties ·{" "}
                      {b.documents?.length ?? 0} documents
                    </div>
                  ) : null}
                </div>
                <Link className="underline" href={`/brokers/${b.id}`}>
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-600">No brokers yet.</p>
      )}
    </main>
  );
}
