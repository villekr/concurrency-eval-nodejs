import { handler } from "./index.mjs";

let event = {
  s3_bucket_name: process.env.S3_BUCKET_NAME,
  folder: process.env.FOLDER,
  find: null,
};
let response = await handler(event);
console.log(response);

event.find = process.env.FIND;
response = await handler(event);
console.log(response);
