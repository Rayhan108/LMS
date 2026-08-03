import { Request } from 'express';
import { Upload } from '@aws-sdk/lib-storage';
import path from 'path';
import crypto from 'crypto';

import AppError from '../errors/AppError';
import httpStatus from 'http-status';
import s3Client from '../utils/s3';
import config from '../config';

const uploadImage = async (
  req: Request,
  file?: Express.Multer.File,
): Promise<string> => {
  const target = file ?? req.file;

  if (!target) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please upload a file');
  }

  const fileExtension = path.extname(target.originalname);
  // Extract filename without extension and replace spaces/special chars
  const baseName = path.basename(target.originalname, fileExtension).replace(/[^a-zA-Z0-9]/g, '_');
  
  // Create a unique filename: educology/timestamp-originalName.ext
  const fileName = `educology/${Date.now()}-${baseName}${fileExtension}`;

  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: config.aws_s3_bucket_name as string,
        Key: fileName,
        Body: target.buffer,
        ContentType: target.mimetype,
        // Optional: add this if your bucket supports ACLs and you want it public
        // ACL: 'public-read',
      },
    });

    await upload.done();

    // Construct the public S3 URL
    return `https://${config.aws_s3_bucket_name}.s3.${config.aws_s3_region}.amazonaws.com/${fileName}`;
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'AWS S3 Upload Failed',
    );
  }
};

export default uploadImage;