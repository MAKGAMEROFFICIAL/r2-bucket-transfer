# R2 to R2 Data Transfer Tool

A lightweight, high-performance TypeScript utility to transfer files between two Cloudflare R2 buckets (even across different accounts). 

This tool uses **Node.js streams** to pipe data directly from the source to the destination. This means it **does not** download files to your local disk, ensuring low memory usage and high speed, even for large files.

## 🚀 Features

- **Cross-Account Support**: Move data between completely different Cloudflare accounts.
- **Streaming Transfer**: Uses `stream.Readable` to pipe data, keeping RAM usage low.
- **Multipart Uploads**: Automatically handles large files using `@aws-sdk/lib-storage`.
- **S3 Compatible**: Built on the official AWS SDK for JavaScript v3.
- **Type-Safe**: Written in TypeScript.

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- Cloudflare R2 Credentials (Account IDs, Access Keys, and Secret Keys) for both source and destination.

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
   cd your-repo-name


2. **Install dependencies:** (make sure to install typescript,and other packages needed to run typescript)

```bash
npm install

```
**or install manually**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage dotenv
npm install -D typescript @types/node ts-node

```



## ⚙️ Configuration
RENAME `.env.example`  to `.env` .
or (Create a `.env` file in the root directory. Copy the structure below and fill in your details.)

**Note:** The script uses specific variable names (`SENDER` and `RECIVER`) to distinguish between the accounts.

```ini
# --- SENDER (Source Account) ---
# The Account ID is found in the right sidebar of the R2 Dashboard
SENDER_ACCOUNT_ID=your_source_account_id
SENDER_BUCKET_NAME=your_source_bucket_name
ACCESS_KEY_SENDER=your_source_access_key
SECRET_KEY_SENDER=your_source_secret_key

# --- RECIVER (Destination Account) ---
RECIVER_ACCOUNT_ID=your_destination_account_id
RECIVER_BUCKET_NAME=your_destination_bucket_name
ACCESS_KEY_RECIVER=your_destination_access_key
SECRET_KEY_RECIVER=your_destination_secret_key

```

## 🏃 Usage

You can run the script directly using `ts-node` (installed as a dev dependency):

```bash
npx ts-node transfer.ts

```

### How it works

1. The script authenticates with both R2 buckets.
2. It lists objects in the `SENDER` bucket.
3. It creates a read stream from the sender and a write stream to the receiver.
4. Files are uploaded to the destination immediately as they are being read.
5. It handles pagination automatically if you have thousands of files.

## ⚠️ Disclaimer

Always backup critical data before performing bulk operations. While this script copies data (it does not delete from source), verifying the integrity of the transfer on the destination bucket is recommended.

## 📄 License

This project is open source and available under the [MIT License](https://www.google.com/search?q=LICENSE).
