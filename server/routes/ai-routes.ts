import { Request, Response } from 'express';
import { valBot } from '../ai/valbot-engine';
import { securityHeaders } from '../security/pci-compliance';

// ValBot AI Assistant Routes
export const getAiInsights = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      const { category, type } = req.query;

      // Run each insight generator independently so a single failure
      // doesn't take down the whole dashboard.
      const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
        try { return await fn(); } catch (err) {
          console.error('AI insight component failed:', err);
          return fallback;
        }
      };

      const insights = {
        demandForecasts: await safe(() => valBot.generateDemandForecast(1, 7), [] as any),
        stockRecommendations: await safe(() => valBot.generateStockRecommendations(), [] as any),
        suspiciousActivity: await safe(() => valBot.detectSuspiciousTransactions(), [] as any),
        promotionSuggestions: await safe(() => valBot.generatePromotionSuggestions(), [] as any),
        storeHealth: await safe(() => valBot.calculateStoreHealthScore(), { score: 0, status: 'unavailable' } as any),
      };

      if (category) {
        res.json(insights[category as keyof typeof insights] || []);
      } else {
        res.json(insights);
      }
    } catch (error: any) {
      console.error('Error fetching AI insights:', error);
      res.status(500).json({ error: 'Failed to fetch AI insights' });
    }
  }
];

export const processNaturalLanguageQuery = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      const userId = (req as any).session?.userId || 1;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const response = await valBot.processNaturalLanguageQuery(query, userId);
      res.json(response);
    } catch (error: any) {
      console.error('Error processing natural language query:', error);
      res.status(500).json({ error: 'Failed to process query' });
    }
  }
];

export const getStaffPerformanceAnalytics = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      const { timeframe = '7d' } = req.query;
      const analysis = await valBot.analyzeStaffPerformance(timeframe as string);
      res.json(analysis);
    } catch (error: any) {
      console.error('Error analyzing staff performance:', error);
      res.status(500).json({ error: 'Failed to analyze staff performance' });
    }
  }
];

export const getCustomerBehaviorAnalytics = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      const { customerId } = req.query;
      const analysis = await valBot.analyzeCustomerBehavior(
        customerId ? parseInt(customerId as string) : undefined
      );
      res.json(analysis);
    } catch (error: any) {
      console.error('Error analyzing customer behavior:', error);
      res.status(500).json({ error: 'Failed to analyze customer behavior' });
    }
  }
];

export const generateInventoryForecast = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      const { productId, days = 7 } = req.query;
      
      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const forecast = await valBot.generateDemandForecast(
        parseInt(productId as string),
        parseInt(days as string)
      );
      
      res.json(forecast);
    } catch (error: any) {
      console.error('Error generating inventory forecast:', error);
      res.status(500).json({ error: 'Failed to generate forecast' });
    }
  }
];

export const getStoreHealthDashboard = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      const healthScore = await valBot.calculateStoreHealthScore();
      res.json(healthScore);
    } catch (error: any) {
      console.error('Error fetching store health:', error);
      res.status(500).json({ error: 'Failed to fetch store health data' });
    }
  }
];

export const triggerAiAnalysis = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      const { analysisType } = req.body;
      
      let result;
      switch (analysisType) {
        case 'fraud_detection':
          result = await valBot.detectSuspiciousTransactions();
          break;
        case 'promotion_optimization':
          result = await valBot.generatePromotionSuggestions();
          break;
        case 'inventory_optimization':
          result = await valBot.generateStockRecommendations();
          break;
        default:
          return res.status(400).json({ error: 'Invalid analysis type' });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error('Error triggering AI analysis:', error);
      res.status(500).json({ error: 'Failed to perform AI analysis' });
    }
  }
];