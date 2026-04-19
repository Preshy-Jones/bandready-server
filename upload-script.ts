import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const files = [
  { path: '/Users/preciousadedibu/.gemini/antigravity/brain/1d2b7782-911d-46a7-bc66-6258f04dd638/average_monthly_temperatures_1776613214284.png', key: 'images/task1/average_monthly_temperatures.png' },
  { path: '/Users/preciousadedibu/.gemini/antigravity/brain/1d2b7782-911d-46a7-bc66-6258f04dd638/physical_activity_age_groups_1776613230483.png', key: 'images/task1/physical_activity_age_groups.png' },
  { path: '/Users/preciousadedibu/.gemini/antigravity/brain/1d2b7782-911d-46a7-bc66-6258f04dd638/energy_sources_1985_2005_1776613243101.png', key: 'images/task1/energy_sources_1985_2005.png' },
  { path: '/Users/preciousadedibu/.gemini/antigravity/brain/1d2b7782-911d-46a7-bc66-6258f04dd638/underground_railway_systems_1776613254845.png', key: 'images/task1/underground_railway_systems.png' },
  { path: '/Users/preciousadedibu/.gemini/antigravity/brain/1d2b7782-911d-46a7-bc66-6258f04dd638/cement_concrete_process_1776613293808.png', key: 'images/task1/cement_concrete_process.png' },
  { path: '/Users/preciousadedibu/.gemini/antigravity/brain/1d2b7782-911d-46a7-bc66-6258f04dd638/university_campus_2000_present_1776613311997.png', key: 'images/task1/university_campus_2000_present.png' },
  { path: '/Users/preciousadedibu/.gemini/antigravity/brain/1d2b7782-911d-46a7-bc66-6258f04dd638/further_education_britain_1776613325155.png', key: 'images/task1/further_education_britain.png' },
  { path: '/Users/preciousadedibu/.gemini/antigravity/brain/1d2b7782-911d-46a7-bc66-6258f04dd638/radio_tv_audiences_1776613336822.png', key: 'images/task1/radio_tv_audiences.png' },
];

async function main() {
  for (const file of files) {
    const fileContent = fs.readFileSync(file.path);
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: file.key,
      Body: fileContent,
      ContentType: 'image/png',
    });
    
    await s3.send(command);
    console.log(`Uploaded ${file.key} to https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}`);
  }
}

main().catch(console.error);
