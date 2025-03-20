# National Parks MCP Server

MCP Server for the National Park Service (NPS) API, providing real-time information about U.S. National Parks, including park details, alerts, and activities.

## Features

- **Comprehensive Park Information**: Search and retrieve detailed information about all U.S. National Parks
- **Current Alerts and Closures**: Get real-time alerts, closures, and hazardous conditions for parks
- **Search Capabilities**: Find parks by state, activities, or keywords
- **Structured Data**: Well-formatted data optimized for AI consumption

## Tools

1. `findParks`
   - Search for national parks based on various criteria
   - Inputs:
     - `stateCode` (optional string): Filter parks by state code (e.g., "CA" for California). Multiple states can be comma-separated (e.g., "CA,OR,WA")
     - `q` (optional string): Search term to filter parks by name or description
     - `limit` (optional number): Maximum number of parks to return (default: 10, max: 50)
     - `start` (optional number): Start position for results (useful for pagination)
     - `activities` (optional string): Filter by available activities (e.g., "hiking,camping")
   - Returns: Matching parks with detailed information

2. `getParkDetails`
   - Get comprehensive information about a specific national park
   - Inputs:
     - `parkCode` (string): The park code of the national park (e.g., "yose" for Yosemite, "grca" for Grand Canyon)
   - Returns: Detailed park information including descriptions, hours, fees, contacts, and activities

3. `getAlerts`
   - Get current alerts for national parks including closures, hazards, and important information
   - Inputs:
     - `parkCode` (optional string): Filter alerts by park code (e.g., "yose" for Yosemite). Multiple parks can be comma-separated (e.g., "yose,grca")
     - `limit` (optional number): Maximum number of alerts to return (default: 10, max: 50)
     - `start` (optional number): Start position for results (useful for pagination)
     - `q` (optional string): Search term to filter alerts by title or description
   - Returns: Current alerts organized by park

## Common Park Codes

| Park Name | Park Code |
|-----------|-----------|
| Yosemite | yose |
| Grand Canyon | grca |
| Yellowstone | yell |
| Zion | zion |
| Great Smoky Mountains | grsm |
| Acadia | acad |
| Olympic | olym |
| Rocky Mountain | romo |
| Joshua Tree | jotr |
| Sequoia & Kings Canyon | seki |

For a complete list, visit the [NPS website](https://www.nps.gov/findapark/index.htm).

## Setup

### NPS API Key
1. Get a free API key from the [National Park Service Developer Portal](https://www.nps.gov/subjects/developer/get-started.htm)
2. Store this key securely as it will be used to authenticate requests

### Usage with Claude Desktop

To use this server with Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nationalparks": {
      "command": "npx",
      "args": ["-y", "mcp-server-nationalparks"],
      "env": {
        "NPS_API_KEY": "YOUR_NPS_API_KEY"
      }
    }
  }
}
```

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root with your API key:
   ```
   NPS_API_KEY=your_api_key_here
   ```
4. Build and run the server:
   ```bash
   npm run build
   npm start
   ```

For development with hot reloading:
```bash
npm run dev
```

## Example Usage

### Finding Parks in a State
```
Tell me about national parks in Colorado.
```

### Getting Details About a Specific Park
```
What's the entrance fee for Yellowstone National Park?
```

### Checking for Alerts or Closures
```
Are there any closures or alerts at Yosemite right now?
```

### Planning a Trip Based on Activities
```
Which national parks in Utah have good hiking trails?
```

## Project Structure

- `src/index.ts` - Main entry point for the server
- `src/utils/npsApiClient.ts` - Client for the NPS API
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies and scripts

## Implementation Notes

This server uses the following libraries:
- `@modelcontextprotocol/sdk` - MCP SDK for server implementation
- `axios` - For HTTP requests to the NPS API
- `zod` - For schema validation
- `dotenv` - For environment variable management

## License

This MCP server is licensed under the MIT License. See the LICENSE file for details.