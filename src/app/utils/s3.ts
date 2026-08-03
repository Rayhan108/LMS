import { S3Client } from '@aws-sdk/client-s3';
import config from '../config';

const s3Client = new S3Client({
  region: config.aws_s3_region as string,
  credentials: {
    accessKeyId: config.aws_s3_access_key as string,
    secretAccessKey: config.aws_s3_secret_key as string,
  },
});

export default s3Client;
