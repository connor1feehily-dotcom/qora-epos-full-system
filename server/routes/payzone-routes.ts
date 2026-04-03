import { Request, Response } from 'express';
import { storage } from '../storage';
import {
  initiateSale,
  getTransactionStatus,
  cancelTransaction,
  processRefund,
  processReconciliation,
  getPayzoneConfig
} from './payzone-service';

export async function payzoneInitiateSale(req: Request, res: Response) {
  try {
    const { amount, reference, terminalId, cashbackAmount, gratuityAmount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!reference) {
      return res.status(400).json({ error: 'Transaction reference required' });
    }

    const result = await initiateSale({
      amount: parseFloat(amount),
      reference,
      terminalId,
      cashbackAmount: cashbackAmount ? parseFloat(cashbackAmount) : undefined,
      gratuityAmount: gratuityAmount ? parseFloat(gratuityAmount) : undefined
    });

    res.json(result);
  } catch (error: any) {
    console.error('Payzone sale initiation error:', error);
    res.status(500).json({ error: error.message || 'Failed to initiate payment' });
  }
}

export async function payzoneGetStatus(req: Request, res: Response) {
  try {
    const { transactionId } = req.params;
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }

    const result = await getTransactionStatus(transactionId);
    res.json(result);
  } catch (error: any) {
    console.error('Payzone status check error:', error);
    res.status(500).json({ error: error.message || 'Failed to get transaction status' });
  }
}

export async function payzoneCancel(req: Request, res: Response) {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }

    const result = await cancelTransaction({ transactionId });
    res.json(result);
  } catch (error: any) {
    console.error('Payzone cancel error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel transaction' });
  }
}

export async function payzoneRefund(req: Request, res: Response) {
  try {
    const { originalTransactionId, amount, reference } = req.body;

    if (!originalTransactionId) {
      return res.status(400).json({ error: 'Original transaction ID required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid refund amount' });
    }

    const result = await processRefund({
      originalTransactionId,
      amount: parseFloat(amount),
      reference
    });

    if (result.status === 'APPROVED') {
      try {
        const originalTxn = await storage.getTransaction(parseInt(originalTransactionId));
        if (originalTxn) {
          await storage.createTransaction({
            organizationId: originalTxn.organizationId,
            tillId: originalTxn.tillId,
            userId: originalTxn.userId,
            customerId: originalTxn.customerId,
            status: 'completed',
            subtotal: (-parseFloat(amount) * 0.833).toFixed(2),
            vatAmount: (-parseFloat(amount) * 0.167).toFixed(2),
            total: (-parseFloat(amount)).toFixed(2),
            paymentMethod: 'refund',
            itemCount: 0
          });
        }
      } catch (storageError) {
        console.warn('Could not create refund transaction record:', storageError);
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error('Payzone refund error:', error);
    res.status(500).json({ error: error.message || 'Failed to process refund' });
  }
}

export async function payzoneReconciliation(req: Request, res: Response) {
  try {
    const result = await processReconciliation();
    res.json(result);
  } catch (error: any) {
    console.error('Payzone reconciliation error:', error);
    res.status(500).json({ error: error.message || 'Failed to process reconciliation' });
  }
}

export async function payzoneConfig(req: Request, res: Response) {
  try {
    const config = getPayzoneConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get Payzone configuration' });
  }
}
