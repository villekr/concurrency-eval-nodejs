import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import http from "http";
import https from "https";

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
  // Increase available sockets and enable connection reuse to avoid SDK warnings
  const requestHandler = new NodeHttpHandler({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 1024 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 1024 }),
    // Set to 0 to disable the socket acquisition capacity warning in high-concurrency runs
    socketAcquisitionWarningTimeout: 0,
  });

  const s3 = new S3Client({ requestHandler });
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
      responses.find((value) => value !== null),
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
