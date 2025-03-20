#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
// Import the NPS API client
import { npsApiClient } from './utils/npsApiClient.js';
// Check for API key
if (!process.env.NPS_API_KEY) {
    console.warn('Warning: NPS_API_KEY is not set in environment variables.');
    console.warn('Get your API key at: https://www.nps.gov/subjects/developer/get-started.htm');
}
// Version information
const VERSION = '1.0.0';
// Server instance
const server = new Server({
    name: "nationalparks-mcp-server",
    version: VERSION,
}, {
    capabilities: {
        tools: {},
    },
});
// Define schemas for tool parameters
// Find Parks Schema
const FindParksSchema = z.object({
    stateCode: z.string().optional().describe('Filter parks by state code (e.g., "CA" for California, "NY" for New York). Multiple states can be comma-separated (e.g., "CA,OR,WA")'),
    q: z.string().optional().describe('Search term to filter parks by name or description'),
    limit: z.number().optional().describe('Maximum number of parks to return (default: 10, max: 50)'),
    start: z.number().optional().describe('Start position for results (useful for pagination)'),
    activities: z.string().optional().describe('Filter by available activities (e.g., "hiking,camping")')
});
// Get Park Details Schema
const GetParkDetailsSchema = z.object({
    parkCode: z.string().describe('The park code of the national park (e.g., "yose" for Yosemite, "grca" for Grand Canyon)')
});
// Get Alerts Schema
const GetAlertsSchema = z.object({
    parkCode: z.string().optional().describe('Filter alerts by park code (e.g., "yose" for Yosemite). Multiple parks can be comma-separated (e.g., "yose,grca").'),
    limit: z.number().optional().describe('Maximum number of alerts to return (default: 10, max: 50)'),
    start: z.number().optional().describe('Start position for results (useful for pagination)'),
    q: z.string().optional().describe('Search term to filter alerts by title or description')
});
// List of valid state codes for validation
const STATE_CODES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC', 'AS', 'GU', 'MP', 'PR', 'VI', 'UM'
];
// Utility functions for formatting data
/**
 * Format the park data into a more readable format for LLMs
 */
function formatParkData(parkData) {
    return parkData.map(park => ({
        name: park.fullName,
        code: park.parkCode,
        description: park.description,
        states: park.states.split(',').map(code => code.trim()),
        url: park.url,
        designation: park.designation,
        activities: park.activities.map(activity => activity.name),
        weatherInfo: park.weatherInfo,
        location: {
            latitude: park.latitude,
            longitude: park.longitude
        },
        entranceFees: park.entranceFees.map(fee => ({
            cost: fee.cost,
            description: fee.description,
            title: fee.title
        })),
        operatingHours: park.operatingHours.map(hours => ({
            name: hours.name,
            description: hours.description,
            standardHours: hours.standardHours
        })),
        contacts: {
            phoneNumbers: park.contacts.phoneNumbers.map(phone => ({
                type: phone.type,
                number: phone.phoneNumber,
                description: phone.description
            })),
            emailAddresses: park.contacts.emailAddresses.map(email => ({
                address: email.emailAddress,
                description: email.description
            }))
        },
        images: park.images.map(image => ({
            url: image.url,
            title: image.title,
            altText: image.altText,
            caption: image.caption,
            credit: image.credit
        }))
    }));
}
/**
 * Format park details for a single park
 */
function formatParkDetails(park) {
    // Determine the best address to use as the primary address
    const physicalAddress = park.addresses.find(addr => addr.type === 'Physical') || park.addresses[0];
    // Format operating hours in a more readable way
    const formattedHours = park.operatingHours.map(hours => {
        const { standardHours } = hours;
        const formattedStandardHours = Object.entries(standardHours)
            .map(([day, hours]) => {
            // Convert day to proper case (e.g., 'monday' to 'Monday')
            const properDay = day.charAt(0).toUpperCase() + day.slice(1);
            return `${properDay}: ${hours || 'Closed'}`;
        });
        return {
            name: hours.name,
            description: hours.description,
            standardHours: formattedStandardHours
        };
    });
    return {
        name: park.fullName,
        code: park.parkCode,
        url: park.url,
        description: park.description,
        designation: park.designation,
        states: park.states.split(',').map(code => code.trim()),
        weatherInfo: park.weatherInfo,
        directionsInfo: park.directionsInfo,
        directionsUrl: park.directionsUrl,
        location: {
            latitude: park.latitude,
            longitude: park.longitude,
            address: physicalAddress ? {
                line1: physicalAddress.line1,
                line2: physicalAddress.line2,
                city: physicalAddress.city,
                stateCode: physicalAddress.stateCode,
                postalCode: physicalAddress.postalCode
            } : undefined
        },
        contacts: {
            phoneNumbers: park.contacts.phoneNumbers.map(phone => ({
                type: phone.type,
                number: phone.phoneNumber,
                extension: phone.extension,
                description: phone.description
            })),
            emailAddresses: park.contacts.emailAddresses.map(email => ({
                address: email.emailAddress,
                description: email.description
            }))
        },
        entranceFees: park.entranceFees.map(fee => ({
            title: fee.title,
            cost: `$${fee.cost}`,
            description: fee.description
        })),
        entrancePasses: park.entrancePasses.map(pass => ({
            title: pass.title,
            cost: `$${pass.cost}`,
            description: pass.description
        })),
        operatingHours: formattedHours,
        topics: park.topics.map(topic => topic.name),
        activities: park.activities.map(activity => activity.name),
        images: park.images.map(image => ({
            url: image.url,
            title: image.title,
            altText: image.altText,
            caption: image.caption,
            credit: image.credit
        }))
    };
}
/**
 * Format the alert data into a more readable format for LLMs
 */
function formatAlertData(alertData) {
    return alertData.map(alert => {
        // Get the date part from the lastIndexedDate (which is in ISO format)
        const lastUpdated = alert.lastIndexedDate ? new Date(alert.lastIndexedDate).toLocaleDateString() : 'Unknown';
        // Categorize the alert type
        let alertType = alert.category;
        if (alertType === 'Information') {
            alertType = 'Information (non-emergency)';
        }
        else if (alertType === 'Caution') {
            alertType = 'Caution (potential hazard)';
        }
        else if (alertType === 'Danger') {
            alertType = 'Danger (significant hazard)';
        }
        else if (alertType === 'Park Closure') {
            alertType = 'Park Closure (area inaccessible)';
        }
        return {
            title: alert.title,
            description: alert.description,
            parkCode: alert.parkCode,
            type: alertType,
            url: alert.url,
            lastUpdated
        };
    });
}
// Register tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "findParks",
                description: "Search for national parks based on state, name, activities, or other criteria",
                inputSchema: zodToJsonSchema(FindParksSchema),
            },
            {
                name: "getParkDetails",
                description: "Get detailed information about a specific national park",
                inputSchema: zodToJsonSchema(GetParkDetailsSchema),
            },
            {
                name: "getAlerts",
                description: "Get current alerts for national parks including closures, hazards, and important information",
                inputSchema: zodToJsonSchema(GetAlertsSchema),
            },
        ],
    };
});
// Handle tool executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        if (!request.params.arguments) {
            throw new Error("Arguments are required");
        }
        switch (request.params.name) {
            case "findParks": {
                const args = FindParksSchema.parse(request.params.arguments);
                // Validate state codes if provided
                if (args.stateCode) {
                    const providedStates = args.stateCode.split(',').map(s => s.trim().toUpperCase());
                    const invalidStates = providedStates.filter(state => !STATE_CODES.includes(state));
                    if (invalidStates.length > 0) {
                        return {
                            content: [{
                                    type: "text",
                                    text: JSON.stringify({
                                        error: `Invalid state code(s): ${invalidStates.join(', ')}`,
                                        validStateCodes: STATE_CODES
                                    })
                                }]
                        };
                    }
                }
                // Set default limit if not provided or if it exceeds maximum
                const limit = args.limit ? Math.min(args.limit, 50) : 10;
                // Format the request parameters
                const requestParams = {
                    limit,
                    ...args
                };
                const response = await npsApiClient.getParks(requestParams);
                // Format the response for better readability by the AI
                const formattedParks = formatParkData(response.data);
                const result = {
                    total: parseInt(response.total),
                    limit: parseInt(response.limit),
                    start: parseInt(response.start),
                    parks: formattedParks
                };
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(result, null, 2)
                        }]
                };
            }
            case "getParkDetails": {
                const args = GetParkDetailsSchema.parse(request.params.arguments);
                const response = await npsApiClient.getParkByCode(args.parkCode);
                // Check if park was found
                if (!response.data || response.data.length === 0) {
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify({
                                    error: 'Park not found',
                                    message: `No park found with park code: ${args.parkCode}`
                                }, null, 2)
                            }]
                    };
                }
                // Format the response for better readability by the AI
                const parkDetails = formatParkDetails(response.data[0]);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(parkDetails, null, 2)
                        }]
                };
            }
            case "getAlerts": {
                const args = GetAlertsSchema.parse(request.params.arguments);
                // Set default limit if not provided or if it exceeds maximum
                const limit = args.limit ? Math.min(args.limit, 50) : 10;
                // Format the request parameters
                const requestParams = {
                    limit,
                    ...args
                };
                const response = await npsApiClient.getAlerts(requestParams);
                // Format the response for better readability by the AI
                const formattedAlerts = formatAlertData(response.data);
                // Group alerts by park code for better organization
                const alertsByPark = {};
                formattedAlerts.forEach(alert => {
                    if (!alertsByPark[alert.parkCode]) {
                        alertsByPark[alert.parkCode] = [];
                    }
                    alertsByPark[alert.parkCode].push(alert);
                });
                const result = {
                    total: parseInt(response.total),
                    limit: parseInt(response.limit),
                    start: parseInt(response.start),
                    alerts: formattedAlerts,
                    alertsByPark
                };
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(result, null, 2)
                        }]
                };
            }
            default:
                throw new Error(`Unknown tool: ${request.params.name}`);
        }
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            error: 'Validation error',
                            details: error.errors
                        }, null, 2)
                    }]
            };
        }
        console.error('Error executing tool:', error);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        error: 'Server error',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }, null, 2)
                }]
        };
    }
});
// Start the server
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("National Parks MCP Server running on stdio");
}
runServer().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
