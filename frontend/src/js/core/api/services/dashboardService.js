import apiClient from '../apiClient';
import API_ENDPOINTS from '../endpoints';

/**
 * Service for dashboard-related API calls
 */
class DashboardService {
  /**
   * Get dashboard summary data
   * @param {Object} options - Options for the request
   * @param {string} options.timeRange - Time range for the data (default: '30_days')
   * @param {string} options.viewType - View type for filtering (default: 'all')
   * @returns {Promise<Object>} Dashboard summary data
   */
  async getDashboardSummary(options = {}) {
    const { timeRange = '30_days', viewType = 'all' } = options;
    
    try {
      // Build URL with query parameters
      const url = `${API_ENDPOINTS.dashboard.summary}?time_range=${timeRange}&view_type=${viewType}`;
      console.log('Fetching dashboard summary from:', url);
      
      const response = await apiClient.get(url);
      console.log('Dashboard summary response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }
  
  /**
   * Get sales data over time
   * @param {Object} options - Options for the request
   * @returns {Promise<Object>} Sales time series data
   */
  async getSalesData(options = {}) {
    const { period = 'daily', days = 30, viewType = 'seller' } = options;
    const params = new URLSearchParams({
      period,
      days,
      view_type: viewType
    });
    
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.dashboard.sales}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sales data:', error);
      throw error;
    }
  }
  
  /**
   * Get category breakdown
   * @param {Object} options - Options for the request
   * @returns {Promise<Array>} Category breakdown data
   */
  async getCategoryBreakdown(options = {}) {
    const { viewType = 'seller' } = options;
    const params = new URLSearchParams({ view_type: viewType });
    
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.dashboard.categories}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category breakdown:', error);
      throw error;
    }
  }
  
  /**
   * Get top products
   * @param {Object} options - Options for the request
   * @returns {Promise<Array>} Top products data
   */
  async getTopProducts(options = {}) {
    const { limit = 5, viewType = 'seller' } = options;
    const params = new URLSearchParams({
      limit,
      view_type: viewType
    });
    
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.dashboard.topProducts}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw error;
    }
  }
}

export default new DashboardService();