const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const dotenv = require('dotenv');
dotenv.config();

const STRAPI_UPLOAD_URL = process.env.STRAPI_UPLOAD_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const WORDPRESS_API = process.env.WORDPRESS_API;
const TEMP_MEDIA_DIR = path.join(__dirname, "temp_media");
const IMAGE_MAPPING_FILE = path.join(__dirname, "image_mappings.json");

const DELAY_MS = 5000; 
const MAX_RETRIES = 3; 

let imageMappings = {};
if (fs.existsSync(IMAGE_MAPPING_FILE)) {
  imageMappings = JSON.parse(fs.readFileSync(IMAGE_MAPPING_FILE, "utf8"));
}

// Ensure temp_media directory exists
if (!fs.existsSync(TEMP_MEDIA_DIR)) {
  fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
}

// Download image from Wordpress Api
async function downloadImage(imageUrl, filename) {
  try {
    console.log(`📥 Downloading image: ${imageUrl}...`);
    const imagePath = path.join(TEMP_MEDIA_DIR, filename);

    const response = await axios({
      url: imageUrl,
      responseType: "stream",
    });

    await new Promise((resolve, reject) => {
      const stream = response.data.pipe(fs.createWriteStream(imagePath));
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    console.log(`✅ Image saved: ${imagePath}`);
    return imagePath;
  } catch (error) {
    console.error(`❌ Error downloading image: ${imageUrl}`, error.message);
    return null;
  }
}

// Upload image to Strapi
async function uploadImage(filePath, attempt = 1) {
  const fileName = path.basename(filePath);

  if (imageMappings[fileName]) {
    console.log(`✅ Image already uploaded: ${fileName}`);
    return imageMappings[fileName];
  }

  try {
    console.log(`📤 Uploading: ${filePath} (Attempt ${attempt})`);
    
    const formData = new FormData();
    formData.append("files", fs.createReadStream(filePath));

    const response = await axios.post(STRAPI_UPLOAD_URL, formData, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        ...formData.getHeaders(),
      },
    });

    const uploadedImage = response.data[0];
    console.log(`✅ Uploaded: ${uploadedImage.url}`);

    // Save image mapping
    imageMappings[fileName] = uploadedImage.id;
    fs.writeFileSync(IMAGE_MAPPING_FILE, JSON.stringify(imageMappings, null, 2));

    return uploadedImage.id;
  } catch (error) {
    console.error(`❌ Error uploading ${fileName}: ${error.message}`);

    if (attempt < MAX_RETRIES) {
      console.log(`🔄 Retrying ${fileName} (Attempt ${attempt + 1}) in ${DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      return uploadImage(filePath, attempt + 1);
    } else {
      console.error(`❌ Skipping ${fileName} after ${MAX_RETRIES} failed attempts.`);
      return null;
    }
  }
}

// Fetch WordPress posts
async function fetchWordPressPosts() {
  try {
    console.log("📡 Fetching posts from WordPress API...");
    const response = await axios.get(WORDPRESS_API);
    console.log("✅ Data fetched:", response.data.length, "posts found.");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching WordPress posts:", error.message);
    process.exit(1);
  }
}

// Process images from WordPress posts
async function processImages() {
  const posts = await fetchWordPressPosts();
  
  for (const post of posts) {
    if (post.featured_image) {
      const imageUrl = post.featured_image;
      const fileName = path.basename(imageUrl);
      
      const imagePath = await downloadImage(imageUrl, fileName);
      if (imagePath) {
        await uploadImage(imagePath);
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
  }
  console.log("🎉 Image processing completed!");
}

processImages();
