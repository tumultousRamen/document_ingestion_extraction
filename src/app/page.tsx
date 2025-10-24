"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function Home() {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const router = useRouter();

  // Poll for the broker after correspondence upload
  const brokerByDoc = api.broker.getByDocumentId.useQuery(
    { documentId: documentId ?? "" },
    {
      enabled: !!documentId && !brokerId,
      refetchInterval: brokerId ? false : 2000,
    },
  );

  const recentBrokers = api.broker.list.useQuery({ limit: 10 });

  // Step 1: Upload correspondence (single file)
  const getUploadUrlMutation = api.broker.getUploadUrl.useMutation();
  const createBrokerMutation = api.broker.create.useMutation({
    onSuccess: async (doc) => {
      setDocumentId(doc.id);
    },
  });

  useEffect(() => {
    if (brokerByDoc.data?.id && !brokerId) {
      setBrokerId(brokerByDoc.data.id);
    }
  }, [brokerByDoc.data?.id, brokerId]);

  useEffect(() => {
    if (brokerId) {
      router.push(`/brokers/${brokerId}`);
    }
  }, [brokerId, router]);

  async function uploadToPresigned(url: string, file: File) {
    const res = await fetch(url, {
      method: "PUT",
      body: file,
    });
    if (!res.ok) throw new Error("Failed to upload to S3");
  }

  const onDropCorrespondence = useCallback(
    (acceptedFiles: File[]) => {
      void (async () => {
        const [file] = acceptedFiles;
        if (!file) return;
        // Get presigned URL, upload, then create broker document by objectKey
        const { objectKey, url } = await getUploadUrlMutation.mutateAsync({
          name: file.name,
          type: file.type,
        });
        await uploadToPresigned(url, file);
        createBrokerMutation.mutate({
          objectKey,
          name: file.name,
          type: file.type,
        });
      })();
    },
    [createBrokerMutation, getUploadUrlMutation],
  );

  const correspondenceDrop = useDropzone({
    onDrop: onDropCorrespondence,
    multiple: false,
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">
        Insurance Submission Ingest
      </h1>

      <section className="mb-8 rounded-lg border p-4">
        <header className="mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <h2 className="text-lg font-medium">Step 1: Upload Correspondence</h2>
        </header>
        <div
          {...correspondenceDrop.getRootProps({
            className:
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center hover:bg-gray-50",
          })}
        >
          <input {...correspondenceDrop.getInputProps()} />
          <Upload className="h-8 w-8" />
          <p className="text-sm text-gray-700">
            Drag &apos;n&apos; drop the correspondence file here, or click to
            select a file
          </p>
          <p className="text-xs text-gray-500">Only one file is allowed</p>
        </div>
        {createBrokerMutation.isPending && (
          <p className="mt-2 text-sm text-gray-600">Uploading…</p>
        )}
        {documentId && !brokerId && (
          <p className="mt-2 text-sm text-gray-600">
            Correspondence uploaded. Waiting for broker extraction…
          </p>
        )}
        {documentId && brokerId && (
          <p className="mt-2 text-sm text-green-700">
            Broker extracted (ID: {brokerId}).
          </p>
        )}
        {brokerId && (
          <p className="mt-2 text-sm text-green-700">
            Broker extracted. You can upload supporting documents now.
          </p>
        )}
      </section>

      <div className="mt-6 text-sm text-gray-700">
        <Link className="underline" href="/brokers">
          View all brokers
        </Link>
      </div>

      {/* Broker details removed from home; redirect takes user to /brokers/[id] */}

      <section className="mt-8 rounded-lg border p-4">
        <h3 className="mb-3 text-lg font-semibold">Recent Brokers</h3>
        {recentBrokers.data?.length ? (
          <ul className="grid grid-cols-1 gap-2 text-sm text-gray-800">
            {recentBrokers.data.map((b) => (
              <li key={b.id} className="rounded-md border p-3">
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
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No brokers yet.</p>
        )}
      </section>
    </main>
  );
}
