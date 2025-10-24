"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Mail, Files } from "lucide-react";
import { api } from "~/trpc/react";

export default function Home() {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [brokerId, setBrokerId] = useState<string | null>(null);

  // Poll for the broker after correspondence upload
  const brokerByDoc = api.broker.getByDocumentId.useQuery(
    { documentId: documentId ?? "" },
    {
      enabled: !!documentId && !brokerId,
      refetchInterval: brokerId ? false : 2000,
    },
  );

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

  // Step 2: Upload supporting documents (up to 10)
  const getUploadUrlsMutation = api.documents.getUploadUrls.useMutation();
  const uploadDocsMutation = api.documents.upload.useMutation();
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);

  const onDropDocuments = useCallback((acceptedFiles: File[]) => {
    setSelectedDocs((prev) => {
      const combined = [...prev, ...acceptedFiles];
      return combined.slice(0, 10);
    });
  }, []);

  const documentsDrop = useDropzone({
    onDrop: onDropDocuments,
    multiple: true,
    maxFiles: 10,
  });

  const canUploadDocs = useMemo(
    () => brokerId !== null && selectedDocs.length > 0,
    [brokerId, selectedDocs.length],
  );

  const handleUploadDocuments = useCallback(async () => {
    if (!brokerId || selectedDocs.length === 0) return;
    // Request presigned URLs, upload, then send objectKeys to server
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
  }, [brokerId, selectedDocs, getUploadUrlsMutation, uploadDocsMutation]);

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
        {brokerId && (
          <p className="mt-2 text-sm text-green-700">
            Broker extracted. You can upload supporting documents now.
          </p>
        )}
      </section>

      <section className="rounded-lg border p-4">
        <header className="mb-4 flex items-center gap-2">
          <Files className="h-5 w-5" />
          <h2 className="text-lg font-medium">Step 2: Upload Documents</h2>
        </header>
        <div
          {...documentsDrop.getRootProps({
            className:
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center hover:bg-gray-50",
          })}
        >
          <input {...documentsDrop.getInputProps()} />
          <Upload className="h-8 w-8" />
          <p className="text-sm text-gray-700">
            Drag &apos;n&apos; drop up to 10 supporting documents here, or click
            to select files
          </p>
        </div>
        {selectedDocs.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-gray-700">
            {selectedDocs.map((f, idx) => (
              <li key={idx}>{f.name}</li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <button
            onClick={handleUploadDocuments}
            disabled={!canUploadDocs || uploadDocsMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> Upload
          </button>
          {uploadDocsMutation.isPending && (
            <span className="ml-2 text-sm text-gray-600">Uploading…</span>
          )}
        </div>
      </section>
    </main>
  );
}
