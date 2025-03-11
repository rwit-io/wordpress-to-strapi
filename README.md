# WordPress to Strapi Migration

This guide outlines the step-by-step process for migrating WordPress posts and media assets to Strapi using two scripts:

1. **DownloadAndUploadImages.js** – Downloads images from WordPress and uploads them to Strapi.
2. **upload_posts.js** – Fetches posts from WordPress and imports them into Strapi, linking the uploaded images.

## Prerequisites

Before running the scripts, ensure you have:

- **Node.js** installed.
- **Strapi** instance running (default: `http://localhost:1337`).
- **WordPress API** endpoint accessible.
- **Valid Strapi API Token** for authentication.

## Step 1: Configure the Scripts

Before running the scripts, update the following variables:

- **Strapi API Token** (`STRAPI_TOKEN`) in both `DownloadAndUploadImages.js` and `upload_posts.js`.
- **Strapi Upload URL** (`STRAPI_UPLOAD_URL`) in `DownloadAndUploadImages.js`.
- **WordPress API URL** (`WORDPRESS_API`) in `upload_posts.js`.

## Step 2: Install Dependencies

Navigate to the project directory and install the required dependencies:

```bash
npm install axios form-data date-fns
```

## Step 3: Upload Media Assets

Run the `DownloadAndUploadImages.js` script to upload all media assets from WordPress to Strapi:

```bash
node DownloadAndUploadImages.js
```

### Important Notes:
- The script reads images from the `temp_media` folder.
- If an image has already been uploaded, it will be skipped.
- If you want to re-upload all media assets, delete `image_mappings.json` before running the script.

## Step 4: Migrate Posts

After uploading images, run the `upload_posts.js` script to migrate WordPress posts to Strapi:

```bash
node upload_posts.js
```

### Features:
- Fetches posts from the WordPress API.
- Checks if the featured image is uploaded and assigns the correct reference.
- Skips posts that already exist in Strapi (based on slug uniqueness).
- Ensures a smooth migration process with error handling and retry mechanisms.

## Troubleshooting

- **Image upload fails repeatedly?** Check if Strapi’s media library is configured correctly.
- **Posts are not saving?** Ensure the `slug` field in Strapi is set as a **unique identifier (UID)**.
- **Authentication errors?** Verify that the Strapi API token has the correct permissions.

## Blog

You can also check our blog for a detailed step-by-step migration guide: [How to Migrate from WordPress to Strapi](https://www.rwit.io/blog/)

## Acknowledgments

A [remote agency](https://www.rwit.io/) with a global reach specializing in developing custom software and headless applications

Made with Love by [RWIT](https://www.rwit.io/)

## Contact Us

For any questions or support, feel free to reach out at [RWIT](https://www.rwit.io/contact?utm_source=www&utm_medium=contactbutton&utm_campaign=visit).


## Conclusion

By following this process, you can efficiently migrate your WordPress content to Strapi while preserving media relationships and ensuring data integrity.

## License
This script is open-source and can be modified as needed for your migration requirements.

