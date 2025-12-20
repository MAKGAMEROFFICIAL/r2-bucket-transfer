import 'dotenv/config';
import { 
  S3Client, 
  ListObjectsV2Command, 
  GetObjectCommand 
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { Readable } from 'stream';

// --- CONFIGURATION CHECKS ---
const env = process.env;

const requiredKeys = [
  'SENDER_ACCOUNT_ID', 'SENDER_BUCKET_NAME', 'ACCESS_KEY_SENDER', 'SECRET_KEY_SENDER',
  'RECIVER_ACCOUNT_ID', 'RECIVER_BUCKET_NAME', 'ACCESS_KEY_RECIVER', 'SECRET_KEY_RECIVER'
];

for (const key of requiredKeys) {
  if (!env[key]) {
    console.error(`❌ Missing required env variable: ${key}`);
    process.exit(1);
  }
}

// --- INITIALIZE CLIENTS ---
// R2 uses the S3 protocol. We need two clients: one for source, one for dest.

const senderClient = new S3Client({
  region: 'auto',
  endpoint: `https://${env.SENDER_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.ACCESS_KEY_SENDER!,
    secretAccessKey: env.SECRET_KEY_SENDER!,
  },
});

const receiverClient = new S3Client({
  region: 'auto',
  endpoint: `https://${env.RECIVER_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.ACCESS_KEY_RECIVER!,
    secretAccessKey: env.SECRET_KEY_RECIVER!,
  },
});

// --- HELPER FUNCTIONS ---

async function transferFile(key: string) {
  try {
    console.log(`⏳ Starting: ${key}`);

    // 1. Get the stream from the Sender
    const { Body, ContentType } = await senderClient.send(
      new GetObjectCommand({
        Bucket: env.SENDER_BUCKET_NAME,
        Key: key,
      })
    );

    // 2. Upload the stream to the Receiver
    // We use @aws-sdk/lib-storage 'Upload' because it handles multipart uploads
    // automatically, which is safer for large files in R2.
    const upload = new Upload({
      client: receiverClient,
      params: {
        Bucket: env.RECIVER_BUCKET_NAME,
        Key: key,
        Body: Body as Readable | ReadableStream | Blob | string,
        ContentType: ContentType,
      },
    });

    await upload.done();
    console.log(`✅ Completed: ${key}`);
  } catch (error) {
    console.error(`❌ Failed: ${key}`, error);
  }
}

async function main() {
  console.log(`🚀 Starting transfer from ${env.SENDER_BUCKET_NAME} to ${env.RECIVER_BUCKET_NAME}...`);
  
  let continuationToken: string | undefined = undefined;
  let totalProcessed = 0;

  do {
    // List objects in the source bucket
    const listCommand: ListObjectsV2Command = new ListObjectsV2Command({
      Bucket: env.SENDER_BUCKET_NAME,
      ContinuationToken: continuationToken,
    });

    const response = await senderClient.send(listCommand);
    const objects = response.Contents || [];

    if (objects.length === 0) {
      console.log('ℹ️  No objects found to transfer.');
      break;
    }

    // Process files one by one (or in small batches) to avoid memory overload
    for (const object of objects) {
      if (object.Key) {
        await transferFile(object.Key);
        totalProcessed++;
      }
    }

    // Setup next page
    continuationToken = response.NextContinuationToken;

  } while (continuationToken);

  console.log(`\n✨ All Done! Transferred ${totalProcessed} files.`);
}

main().catch((err) => {
  console.error('Fatal Error:', err);
});