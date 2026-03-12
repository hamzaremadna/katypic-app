import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image, Platform } from "react-native";
import { photoApi, Photo } from "../services/api/photo.api";
import { api } from "../services/api/client";

function getImageDimensions(
  uri: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (w, h) => resolve({ width: w, height: h }),
      (error) => reject(error),
    );
  });
}

interface UploadPhotoParams {
  photoUri: string;
  cameraMode?: "SIMPLE" | "PRO";
  caption?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Hook to upload a local photo, create the DB record, and return the Photo.
 *
 * Supports two upload paths:
 * - **Local dev mode** (bucket === "local"): multipart FormData POST to /photos/upload-file
 * - **Production** (S3): presigned PUT URL
 *
 * Usage:
 *   const upload = useUploadPhoto();
 *   const photo = await upload.mutateAsync({ photoUri: "file:///..." });
 */
export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      photoUri,
      cameraMode = "SIMPLE",
      caption,
      latitude,
      longitude,
    }: UploadPhotoParams): Promise<Photo> => {
      // 1. Get image dimensions
      const { width, height } = await getImageDimensions(photoUri);

      // 2. Get upload info from backend (presigned URL or local bucket marker)
      const { data: uploadData } = await photoApi.getUploadUrl("image/jpeg");

      let photoUrl: string;
      let s3Key: string;
      let fileSize: number;

      if (uploadData.bucket === "local") {
        // ── Local dev mode: multipart FormData upload ──
        const formData = new FormData();
        formData.append("file", {
          uri: Platform.OS === "android" ? photoUri : photoUri.replace("file://", ""),
          type: "image/jpeg",
          name: "photo.jpg",
        } as unknown as Blob);

        const { data: localResult } = await api.post<{ key: string; publicUrl: string }>(
          "/photos/upload-file",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );

        photoUrl = localResult.publicUrl;
        s3Key = localResult.key;
        // Estimate file size (we don't know exact blob size in RN FormData path)
        fileSize = width * height * 0.5; // rough estimate
      } else {
        // ── Production: S3 presigned PUT URL ──
        const fileResp = await fetch(photoUri);
        const blob = await fileResp.blob();

        const s3Resp = await fetch(uploadData.uploadUrl, {
          method: "PUT",
          body: blob,
          headers: { "Content-Type": "image/jpeg" },
        });

        if (!s3Resp.ok) {
          throw new Error(`S3 upload failed: ${s3Resp.status}`);
        }

        photoUrl = uploadData.publicUrl;
        s3Key = uploadData.key;
        fileSize = blob.size;
      }

      // 3. Create the photo record in the backend
      const { data: photo } = await photoApi.create({
        s3Key,
        url: photoUrl,
        width,
        height,
        fileSizeBytes: fileSize,
        cameraMode,
        caption,
        latitude,
        longitude,
      });

      return photo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
  });
}
