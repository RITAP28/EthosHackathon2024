import { Request, Response } from "express";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import crypto from 'crypto';

dotenv.config();

const randomNameGenerator = (bytes: number) => crypto.randomBytes(bytes).toString('hex');

const bucketName = process.env.BUCKET_NAME as string;
const bucketRegion = process.env.BUCKET_REGION as string;
const bucketAccessKey = process.env.BUCKET_ACCESS_KEY as string;
const bucketSecretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY as string;

const s3 = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: bucketAccessKey,
    secretAccessKey: bucketSecretAccessKey,
  },
});

export async function uploadMediaFiles(req: Request, res: Response) {
  console.log("request body: ", req.body);
  console.log("request file: ", req.file);

  const fileName = randomNameGenerator(32);
  try {
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: req.file?.buffer,
      ContentType: req.file?.mimetype,
    };
    const command = new PutObjectCommand(params);
    await s3.send(command);

    const signedUrl = await getMediaFileSignedUrl(fileName);

    return res.status(200).json({
        success: true,
        msg: "Media file signed successfully",
        mediaUrl: signedUrl
    });
  } catch (error) {
    console.error("Error while uploading media files: ", error);
    return res.status(500).json({
      success: false,
      msg: "Error while uploading media files",
    });
  }
};

async function getMediaFileSignedUrl(filename: string) {
    try {
        const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: filename
        });

        const signedUrl = await getSignedUrl(
            s3,
            getCommand,
            {
                expiresIn: 24 * 60 * 60
            }
        );

        return signedUrl;
    } catch (error) {
        console.error("Error while getting media file presigned url: ", error);
    }
}
