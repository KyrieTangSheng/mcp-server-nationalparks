/**
 * NPS API Client
 *
 * A client for interacting with the National Park Service API.
 * https://www.nps.gov/subjects/developer/api-documentation.htm
 */
import axios from 'axios';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
/**
 * NPS API Client class
 */
class NPSApiClient {
    api;
    baseUrl = 'https://developer.nps.gov/api/v1';
    apiKey;
    constructor() {
        this.apiKey = process.env.NPS_API_KEY || '';
        if (!this.apiKey) {
            console.warn('Warning: NPS_API_KEY is not set in environment variables.');
            console.warn('Get your API key at: https://www.nps.gov/subjects/developer/get-started.htm');
        }
        // Create axios instance for NPS API
        this.api = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'X-Api-Key': this.apiKey,
            },
        });
        // Add response interceptor for error handling
        this.api.interceptors.response.use((response) => response, (error) => {
            if (error.response) {
                // Check for rate limiting
                if (error.response.status === 429) {
                    console.error('Rate limit exceeded for NPS API. Please try again later.');
                }
                // Log the error details
                console.error('NPS API Error:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                });
            }
            else if (error.request) {
                console.error('No response received from NPS API:', error.request);
            }
            else {
                console.error('Error setting up NPS API request:', error.message);
            }
            return Promise.reject(error);
        });
    }
    /**
     * Fetch parks data from the NPS API
     * @param params Query parameters
     * @returns Promise with parks data
     */
    async getParks(params = {}) {
        try {
            const response = await this.api.get('/parks', { params });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching parks data:', error);
            throw error;
        }
    }
    /**
     * Fetch a specific park by its parkCode
     * @param parkCode The park code (e.g., 'yose' for Yosemite)
     * @returns Promise with the park data
     */
    async getParkByCode(parkCode) {
        try {
            const response = await this.api.get('/parks', {
                params: {
                    parkCode,
                    limit: 1
                }
            });
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching park with code ${parkCode}:`, error);
            throw error;
        }
    }
    /**
     * Fetch alerts from the NPS API
     * @param params Query parameters
     * @returns Promise with alerts data
     */
    async getAlerts(params = {}) {
        try {
            const response = await this.api.get('/alerts', { params });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching alerts data:', error);
            throw error;
        }
    }
    /**
     * Fetch alerts for a specific park
     * @param parkCode The park code (e.g., 'yose' for Yosemite)
     * @returns Promise with the park's alerts
     */
    async getAlertsByParkCode(parkCode) {
        try {
            const response = await this.api.get('/alerts', {
                params: {
                    parkCode
                }
            });
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching alerts for park ${parkCode}:`, error);
            throw error;
        }
    }
    /**
     * Fetch visitor centers from the NPS API
     * @param params Query parameters
     * @returns Promise with visitor centers data
     */
    async getVisitorCenters(params = {}) {
        try {
            const response = await this.api.get('/visitorcenters', { params });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching visitor centers data:', error);
            throw error;
        }
    }
    /**
     * Fetch campgrounds from the NPS API
     * @param params Query parameters
     * @returns Promise with campgrounds data
     */
    async getCampgrounds(params = {}) {
        try {
            const response = await this.api.get('/campgrounds', { params });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching campgrounds data:', error);
            throw error;
        }
    }
    /**
     * Fetch events from the NPS API
     * @param params Query parameters
     * @returns Promise with events data
     */
    async getEvents(params = {}) {
        try {
            const response = await this.api.get('/events', { params });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching events data:', error);
            throw error;
        }
    }
}
// Export a singleton instance
export const npsApiClient = new NPSApiClient();
