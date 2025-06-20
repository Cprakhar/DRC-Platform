import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = 'disaster-images';
const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

export async function uploadImageToGCS(file: Express.Multer.File): Promise<string> {
  const blob = bucket.file(Date.now() + '-' + file.originalname);
  const stream = blob.createWriteStream({ resumable: false, contentType: file.mimetype });
  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', async () => {
      resolve(`https://storage.googleapis.com/${BUCKET_NAME}/${blob.name}`);
    });
    stream.end(file.buffer);
  });
}
