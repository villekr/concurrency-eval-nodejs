import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

export async function handler(event) {
  const start = Date.now();
  const result = await processor(event);
  const elapsed = parseFloat(((Date.now() - start) / 1000).toFixed(1));

  return {
    lang: "node.js",
    detail: "aws-sdk",
    result,
    time: elapsed,
  };
}

async function processor(event) {
  const s3 = new S3Client({});
  const bucketName = event.s3_bucket_name;
  const folder = event.folder;
  const find = event.find;

  const listObjectsParams = {
    Bucket: bucketName,
    Prefix: folder,
    MaxKeys: 1000,
  };
  const response = await s3.send(new ListObjectsV2Command(listObjectsParams));
  const keys = (response.Contents ?? []).map((obj) => obj.Key);

  const memory = parseInt(
    process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || "1024",
    10,
  );
  const cap = Math.max(8, Math.min(64, Math.floor(memory / 32)));

  const results = new Array(keys.length).fill(null);
  let next = 0;
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= keys.length) {
        return;
      }
      results[index] = await get(s3, bucketName, keys[index], find);
    }
  }
  const workers = [];
  for (let i = 0; i < Math.min(cap, keys.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  if (find) {
    const firstMatch = results.find((value) => value !== null);
    return firstMatch ?? null;
  }
  return keys.length.toString();
}

async function get(s3, bucketName, key, find) {
  const getObjectParams = {
    Bucket: bucketName,
    Key: key,
  };
  const response = await s3.send(new GetObjectCommand(getObjectParams));
  const bytes = await response.Body.transformToByteArray();
  if (find) {
    return Buffer.from(bytes).indexOf(Buffer.from(find)) === -1 ? null : key;
  }
  return null;
}
