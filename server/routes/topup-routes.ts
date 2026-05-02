import { Request, Response } from 'express';
import {
  getOperators,
  processTopUp,
  getTopUpConfig,
  IRISH_OPERATORS
} from './topup-service';

export async function topupGetOperators(req: Request, res: Response) {
  try {
    const operators = await getOperators();
    res.json(operators);
  } catch (error: any) {
    console.error('Get operators error:', error);
    res.json(IRISH_OPERATORS);
  }
}

export async function topupProcess(req: Request, res: Response) {
  try {
    const { operatorId, amount, customIdentifier } = req.body;

    if (!operatorId || !amount) {
      return res.status(400).json({ error: 'operatorId and amount are required' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const result = await processTopUp({
      operatorId: parseInt(operatorId),
      amount: parsedAmount,
      customIdentifier
    });

    res.json(result);
  } catch (error: any) {
    console.error('Top-up processing error:', error);
    res.status(500).json({ error: error.message || 'Top-up failed' });
  }
}

export async function topupConfig(req: Request, res: Response) {
  try {
    res.json(getTopUpConfig());
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get top-up configuration' });
  }
}
