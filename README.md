# Concurrency Evaluation - Node.js
Node.js code for [How Do You Like Your Lambda Concurrency](https://ville-karkkainen.medium.com/how-do-you-like-your-aws-lambda-concurrency-part-1-introduction-7a3f7ecfe4b5)-blog series.

# Requirements
* Node.js 22

The target is to implement the following pseudocode as effectively as possible using language-specific idioms and constrains to achieve concurrency/parallelism.
Mandatory requirements:
- Code must contain the following three constructs: 
  - handler: Language-specific AWS Lambda handler or equivalent entrypoint
  - processor: List objects from a specified S3 bucket and process them concurrently/parallel
  - get: Get a single object's body from S3, try to find a string if specified
- The processor-function must be encapsulated with timing functions
- Listing object from S3 bucket needs to support at maximum 1000 objects
- Each S3 objects' body must be fully read
- Code must return at least the following attributes as lambda handler response:
  - time (float): duration as float in seconds rounded to one decimal place
  - result (string): If find-string is specified, then the key of the first s3 object that contains that string (or None). Otherwise, the number of s3 objects is listed
- Code must be implemented using the recent language and AWS SDK versions available at the time of writing
```
func handler(event):
    timer.start()
    result = processor(event)
    timer.stop()
    return {
        "time": timer.elapsed,
        "result": result
    }
    
func processor(event):
    s3_objects = aws_sdk.list_objects(s3_bucket)
    results = [get(s3_key, event[find]) for s3_objects]
    return first_non_none(results) if event[find] else str(len(s3_objects))

func get(s3_key, find):
    body = aws_sdk.get_object(s3_key).body
    return body.find(find) if find else None
```

# Implementation notes
- AWS SDK for JavaScript v3 (client-s3) is used. Listing uses ListObjectsV2 once without pagination. This is intentional because the README caps the bucket at 1000 objects and the API returns up to 1000 keys per call.
- Object bodies are fully read using Body.transformToString(), ensuring full consumption per requirement.
- Concurrency is achieved by issuing all GetObject requests in parallel with Promise.all over the listed keys.
- Timing is measured around the processor call in the handler; the "time" value is seconds rounded to one decimal.
- When a find string is provided, the first matching key is returned; otherwise, the count of listed objects (as a string) is returned.