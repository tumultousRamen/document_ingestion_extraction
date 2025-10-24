"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function BrokerDetailPage() {
  const params = useParams<{ id: string }>();
  const brokerId = params?.id ?? "";

  const brokerDetails = api.broker.getDetails.useQuery(
    { brokerId },
    { enabled: !!brokerId, refetchInterval: 2000 },
  );

  const getUploadUrlsMutation = api.documents.getUploadUrls.useMutation();
  const uploadDocsMutation = api.documents.upload.useMutation();
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);

  async function uploadToPresigned(url: string, file: File) {
    const res = await fetch(url, { method: "PUT", body: file });
    if (!res.ok) throw new Error("Failed to upload to S3");
  }

  const onDropDocuments = useCallback((accepted: File[]) => {
    setSelectedDocs((prev) => {
      const combined = [...prev, ...accepted];
      return combined.slice(0, 10);
    });
  }, []);

  const documentsDrop = useDropzone({
    onDrop: onDropDocuments,
    multiple: true,
    maxFiles: 10,
  });

  const handleUpload = useCallback(async () => {
    if (!brokerId || selectedDocs.length === 0) return;
    const { entries } = await getUploadUrlsMutation.mutateAsync({
      files: selectedDocs.map((f) => ({ name: f.name, type: f.type })),
    });
    await Promise.all(
      entries.map(async (e: { url: string }, idx: number) => {
        await uploadToPresigned(e.url, selectedDocs[idx]!);
      }),
    );
    uploadDocsMutation.mutate({
      brokerId,
      files: entries.map(
        (e: { objectKey: string; name: string; type?: string }) => ({
          objectKey: e.objectKey,
          name: e.name,
          type: e.type,
        }),
      ),
    });
    setSelectedDocs([]);
  }, [brokerId, selectedDocs, getUploadUrlsMutation, uploadDocsMutation]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-4 text-sm text-gray-700">
        <Link className="underline" href="/brokers">
          Back to brokers
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-semibold">Broker</h1>

      {brokerDetails.data ? (
        <section className="rounded-lg border p-4">
          <div className="grid gap-2 text-sm text-gray-800">
            <div>
              <span className="font-medium">Name:</span>{" "}
              {brokerDetails.data.name}
            </div>
            <div>
              <span className="font-medium">Email:</span>{" "}
              {brokerDetails.data.email}
            </div>
            {brokerDetails.data.phone && (
              <div>
                <span className="font-medium">Phone:</span>{" "}
                {brokerDetails.data.phone}
              </div>
            )}
            <div className="mt-2 font-medium">Brokerage Address</div>
            <div>
              {[
                brokerDetails.data.streetAddress,
                brokerDetails.data.unitType &&
                  `${brokerDetails.data.unitType} ${brokerDetails.data.unitNumber}`,
              ]
                .filter(Boolean)
                .join(", ")}
            </div>
            <div>
              {[
                brokerDetails.data.cityTown,
                brokerDetails.data.state,
                brokerDetails.data.zipCode,
              ]
                .filter(Boolean)
                .join(", ")}
            </div>
            <div>
              {[
                brokerDetails.data.province,
                brokerDetails.data.postalCode,
                brokerDetails.data.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </div>
          </div>

          <h2 className="mt-6 mb-3 text-lg font-semibold">Upload Documents</h2>
          <div
            {...documentsDrop.getRootProps({
              className:
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center hover:bg-gray-50",
            })}
          >
            <input {...documentsDrop.getInputProps()} />
            <Upload className="h-8 w-8" />
            <p className="text-sm text-gray-700">
              Drag &apos;n&apos; drop up to 10 files or click to select
            </p>
          </div>
          {selectedDocs.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-gray-700">
              {selectedDocs.map((f, idx) => (
                <li key={idx}>{f.name}</li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <button
              onClick={handleUpload}
              disabled={!selectedDocs.length || uploadDocsMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Upload className="h-4 w-4" /> Upload
            </button>
          </div>

          {brokerDetails.data.properties?.length ? (
            <>
              <h2 className="mt-6 mb-3 text-lg font-semibold">Properties</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {brokerDetails.data.properties.map((p) => (
                  <div key={p.id} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">{p.streetAddress}</div>
                    <div className="text-gray-700">
                      {[p.unitType && `${p.unitType} ${p.unitNumber}`]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    <div className="text-gray-700">
                      {[p.cityTown, p.state, p.zipCode]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    <div className="text-gray-700">
                      {[p.province, p.postalCode, p.country]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-gray-600">
              No properties extracted yet.
            </p>
          )}

          {brokerDetails.data.documents?.length ? (
            <>
              <h2 className="mt-6 mb-3 text-lg font-semibold">Documents</h2>
              <ul className="list-disc pl-6 text-sm text-gray-800">
                {brokerDetails.data.documents.map((d) => (
                  <li key={d.id}>{d.name}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : (
        <p className="text-sm text-gray-600">Loading…</p>
      )}
    </main>
  );
}
