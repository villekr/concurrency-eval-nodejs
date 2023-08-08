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
  };
  const response = await s3.send(new ListObjectsV2Command(listObjectsParams));
  const keys = response.Contents.map((obj) => obj.Key);

  const tasks = keys.map((key) => get(s3, bucketName, key, find));
  const responses = await Promise.all(tasks);
  if (find) {
    const firstNonNullIndex = responses.indexOf(
      responses.find((value) => value !== null)
    );
    return responses.at(firstNonNullIndex);
  }
  return responses.length.toString();
}

async function get(s3, bucketName, key, find) {
  const getObjectParams = {
    Bucket: bucketName,
    Key: key,
  };
  const response = await s3.send(new GetObjectCommand(getObjectParams));
  const body = await response.Body.transformToString();
  if (find) {
    return body.indexOf(find) === -1 ? null : key;
  }
  return null;
}
