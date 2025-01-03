import { Request, Response } from "express";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import crypto from "crypto";
import { logger } from "../utils/utils";
import { prisma } from "../../../../db/db";

dotenv.config();

const randomNameGenerator = (bytes: number) =>
  crypto.randomBytes(bytes).toString("hex");

const expTime = 24 * 60 * 60;

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

if (
  !bucketName ||
  !bucketRegion ||
  !bucketAccessKey ||
  !bucketSecretAccessKey
) {
  logger.error("Missing required AWS S# environment variable", {
    service: "user-service",
    action: "upload-image-with-text",
    errorMessage: "Missing required AWS S3 environment variable",
    function: "uploadMediaFiles()",
    file: "media.controller.ts",
  });
  throw new Error("Missing required AWS S# environment variable");
}

// at first uploading the image to the S3 bucket with a filename and Put operation
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

    console.log("making the signed url for the recently uploaded image");
    const signedUrl = await composeMediaFileSignedUrl(fileName);

    if (signedUrl === null) {
      console.error("Signed URL could not be generated");
      logger.error("Error while getting media file presigned URL", {
        action: "user-service",
        service: "getting-presigned-url-for-uploaded-image",
        errorMessage: "No signed URL found",
        function: "getMediaFileSignedUrl()",
        file: "media.controller.ts",
      });
    }

    // adding the file URL to the database
    await prisma.media.create({
      data: {
        mediaUrl: signedUrl as string,
        type: "IMAGE",
        uploadedAt: new Date(Date.now()),
        expiresAt: new Date(Date.now() + expTime * 1000),
        updatedAt: new Date(Date.now()),
      },
    });

    return res.status(200).json({
      success: true,
      msg: "Media file signed successfully",
      mediaUrl: signedUrl,
    });
  } catch (error) {
    console.error("Error while uploading media files: ", error);
    return res.status(500).json({
      success: false,
      msg: "Error while uploading media files",
    });
  }
}

async function composeMediaFileSignedUrl(filename: string) {
  try {
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: filename,
    });

    const signedUrl = await getSignedUrl(s3, getCommand, {
      expiresIn: expTime,
    });

    console.log("signed url is: ", signedUrl);
    logger.info("Signed URL has been generated successfully", {
      action: "user-service",
      service: "getting-presignedURL-for-uploaded-image",
      function: "getMediaFileSignedUrl()",
      file: "upload.controller.ts",
    });
    return signedUrl;
  } catch (error) {
    console.error("Error while getting media file presigned url: ", error);
    logger.error("Error while getting media file presigned URL", {
      action: "user-service",
      service: "getting-presigned-url-for-uploaded-image",
      errorMessage: error,
      function: "getMediaFileSignedUrl()",
      file: "upload.controller.ts",
    });
    return null;
  }
}

export async function checkMediaUrlExpiresAt(req: Request, res: Response) {
  const mediaUrl = req.query.mediaUrl as string;
  try {
    const mediaUrlInformation = await prisma.media.findFirst({
      where: {
        mediaUrl: mediaUrl,
      },
    });
    if (!mediaUrlInformation) {
      console.log("The media url is not found in the database");
      return;
    };
    if (
      mediaUrlInformation.expiresAt < new Date()
    ) {
      console.log("the media url has expired");
      const filename = mediaUrl.split('/').pop();
      if (!filename) {
        throw new Error("Failed to extract the name of the file stored in media url");
      };
      console.log("filename: ", filename);
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: filename,
      });
      const signedUrl = await getSignedUrl(s3, getCommand, {
        expiresIn: expTime,
      });
      const newExpiresAt = new Date(Date.now() + + 24 * 60 * 60 * 1000);
      await prisma.media.update({
        where: {
          mediaId: mediaUrlInformation.mediaId
        },
        data: {
          expiresAt: newExpiresAt,
          updatedAt: new Date(Date.now())
        }
      });
      return signedUrl;
    } else {
      return;
    }
  } catch (error) {
    console.error("Error while checking media url: ", error);
    logger.error("Error while checking media url", {
      action: "user-service",
      service: "checking-media-url-for-uploaded-image",
      errorMessage: error,
      function: "checkMediaUrlExpiresAt()",
      file: "upload.controller.ts",
    });
  }
}
