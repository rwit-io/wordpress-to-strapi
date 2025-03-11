const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { format } = require("date-fns");
const dotenv = require('dotenv');
dotenv.config();

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const WORDPRESS_API = process.env.WORDPRESS_API;
const IMAGE_MAPPING_FILE = path.join(__dirname, "image_mappings.json");

let imageMappings = {};
if (fs.existsSync(IMAGE_MAPPING_FILE)) {
  imageMappings = JSON.parse(fs.readFileSync(IMAGE_MAPPING_FILE, "utf8"));
}

async function fetchWordPressPosts() {
  try {
    console.log("📡 Fetching posts from WordPress API...");
    const response = await axios.get(WORDPRESS_API);
    console.log(`✅ Found ${response.data.length} posts.`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching WordPress posts:", error.message);
    process.exit(1);
  }
}

async function savePostToStrapi(post) {
    try {
      console.log(`📝 Saving post: ${post.title}...`);
  
      let featuredImageId = null;
      if (post.featured_image) {
        const imageName = path.basename(post.featured_image);
        if (imageMappings[imageName]) {
          featuredImageId = imageMappings[imageName];
        } else {
          console.log(`❌ Image not found for: ${post.title}`);
        }
      }
  
      const formattedDate = format(new Date(post.date), "yyyy-MM-dd");
  
      const postData = {
        data: {
          post_number: post.post_number,
          title: post.title,
          content: post.content,
          slug: post.slug,
          excerpt: post.excerpt,
          author: post.author,
          date: formattedDate,
          featured_image: featuredImageId ? { id: featuredImageId } : null,
        },
      };
  
      try {
        const createResponse = await axios.post(STRAPI_URL, postData, {
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
            "Content-Type": "application/json",
          },
        });
        console.log(`✅ Post saved: ${createResponse.data.data.id}`);
      } catch (error) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.error &&
          error.response.data.error.message === "This attribute must be unique"
        ) {
          console.log(`⚠️ Post with slug "${post.slug}" already exists, skipping.`);
        } else {
          console.error("❌ Error saving post:", error.response ? error.response.data : error.message);
        }
      }
    } catch (error) {
      console.error("❌ Error processing post:", error.response ? error.response.data : error.message);
    }
  }
  
  
  

async function migratePosts() {
  const posts = await fetchWordPressPosts();
  for (const post of posts) {
    await savePostToStrapi(post);
  }
  console.log("🎉 Migration completed!");
}

// Please Run upload_assets script before running this script to upload posts media
migratePosts();
