# ⭐️ GPlay Reviews MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.5+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.7.0-brightgreen.svg)](https://github.com/modelcontextprotocol/servers)

A Model Context Protocol (MCP) server for accessing and analyzing Google Play Store reviews. Developed by Kir Gor (2025).

## 🚀 Features

- **Rating Filters**: Query reviews by star rating, date ranges, and more
- **Advanced Search**: Find reviews containing specific keywords or phrases
- **Reply Management**: Post and track replies to user feedback
- **Automated Analytics**: Generate insights on review sentiment and trends
- **Language Support**: Filter reviews by language and region
- **Device Analytics**: Understand user issues by device type and OS version
- **Integration Ready**: Works seamlessly with Claude and other MCP clients
- **Complete Type Safety**: Fully typed TypeScript codebase with interfaces

## 📋 Requirements

- Node.js 18+
- Google Play Developer API credentials
- An MCP client (like Claude AI)

## 🔧 Installation

### Clone the Repository

```bash
git clone https://github.com/Kirill812/GPlay_reviews_MCP_server.git
cd GPlay_reviews_MCP_server
```

### Install Dependencies

```bash
npm install
```

### Google Play API Setup

1. Create a service account in Google Cloud Console
2. Enable the Google Play Developer API
3. Generate and download your credentials
4. Link your service account to your Google Play Developer account

### Configuration

1. Create a `.env` file based on the example:

```bash
cp .env.example .env
```

2. Set the path to your Google Play API credentials in `.env`:

```
GOOGLE_PLAY_CREDENTIALS_PATH=/path/to/your/credentials.json
LOG_LEVEL=info
STORAGE_DIR=data
USE_MOCK_DATA=false
```

## 🚀 Usage

### Start the Server

```bash
# Build the TypeScript code
npm run build

# Start the server
npm start
```

For development with automatic reloading:

```bash
npm run dev
```

### MCP Integration

Add this configuration to your Claude or other MCP client:

```json
{
  "mcpServers": {
    "GPlay Reviews": {
      "command": "node",
      "args": ["/path/to/GPlay_reviews_MCP_server/dist/index.js"],
      "env": {
        "GOOGLE_PLAY_CREDENTIALS_PATH": "/path/to/credentials.json",
        "LOG_LEVEL": "info",
        "STORAGE_DIR": "data",
        "USE_MOCK_DATA": "false"
      },
      "disabled": false,
      "autoApprove": [
        "get_reviews",
        "search_reviews",
        "post_reply"
      ]
    }
  }
}
```

## 📝 API Documentation

### MCP Tools

#### `get_reviews`

Retrieves reviews for a specific app with comprehensive filtering options.

```jsonc
// Example: Get 5-star reviews from the last week
{
  "appPackage": "com.example.app",
  "filter": {
    "minRating": 5,
    "maxRating": 5,
    "startDate": "2025-03-15T00:00:00Z",
    "limit": 20
  }
}

// Example: Get all 1-star reviews in English
{
  "appPackage": "com.example.app",
  "filter": {
    "minRating": 1,
    "maxRating": 1,
    "languages": ["en"],
    "limit": 50
  }
}
```

#### `search_reviews`

Search for reviews containing specific text across all apps or within a specific app.

```jsonc
// Example: Search for reviews mentioning "crash"
{
  "query": "crash",
  "appPackage": "com.example.app", // Optional
  "limit": 20
}

// Example: Find reviews about battery issues
{
  "query": "battery drain",
  "filter": {
    "minRating": 1,
    "maxRating": 3
  }
}
```

#### `post_reply`

Post a reply to a specific review.

```jsonc
{
  "reviewId": "abc123xyz",
  "replyText": "Thank you for your feedback! We're looking into this issue and will have a fix in our next update."
}
```

### MCP Resources

- `googleplay://apps` - List all accessible apps
- `googleplay://reviews/{appPackage}` - Get reviews for a specific app
- `googleplay://reviews/{appPackage}/{reviewId}` - Get details of a specific review
- `googleplay://stats/{appPackage}` - Get review statistics for an app

## 🧪 Development

### Project Structure

```
/
├── src/                  # Source code
│   ├── repositories/     # Data access layer
│   ├── utils/            # Utility functions
│   ├── types.ts          # TypeScript type definitions
│   └── index.ts          # Server entry point
├── data/                 # JSON file storage (created at runtime)
├── scripts/              # Helper scripts
├── tests/                # Test files
└── dist/                 # Compiled JavaScript (created at build time)
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

Created by Kir Gor (2025)

---

<p align="center">Made with ❤️ for the Model Context Protocol ecosystem</p>
