import { BlobServiceClient } from '@azure/storage-blob';

let blobServiceClient: BlobServiceClient | null = null;

function getBlobServiceClient(): BlobServiceClient | null {
  if (blobServiceClient) return blobServiceClient;

  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (connStr) {
    try {
      blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
      return blobServiceClient;
    } catch (err: any) {
      console.warn('[Azure Storage] Failed to initialize from connection string:', err.message);
    }
  }

  const sasUrl = process.env.AZURE_STORAGE_SAS_URL;
  if (sasUrl) {
    try {
      blobServiceClient = new BlobServiceClient(sasUrl);
      return blobServiceClient;
    } catch (err: any) {
      console.warn('[Azure Storage] Failed to initialize from SAS URL:', err.message);
    }
  }

  return null;
}

export function isAzureStorageConfigured(): boolean {
  return Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_STORAGE_SAS_URL);
}

/**
 * Upload a file buffer to Azure Blob Storage container.
 * Automatically creates the container with public blob access if permitted.
 * Returns public URL on success, or null on failure/unconfigured.
 */
export async function uploadToAzureBlob(
  containerName: string,
  blobName: string,
  buffer: Buffer,
  contentType: string
): Promise<string | null> {
  const client = getBlobServiceClient();
  if (!client) return null;

  try {
    const containerClient = client.getContainerClient(containerName);
    // Ensure container exists (non-fatal if already exists)
    await containerClient.createIfNotExists({ access: 'blob' }).catch(() => {});

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: 'public, max-age=31536000',
      },
    });

    return blockBlobClient.url.split('?')[0];
  } catch (err: any) {
    console.warn(`[Azure Storage] Upload failed for ${containerName}/${blobName}:`, err.message);
    return null;
  }
}
