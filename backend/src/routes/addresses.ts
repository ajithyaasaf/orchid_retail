import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── POST /api/addresses — Create address ────────────────────────────────────
// Accepts guestId for non-authenticated users. If user already has a default
// address, the new one will be secondary unless explicitly set as default.
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, name, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;

    // Validate required fields
    if (!userId || !name || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({ success: false, error: 'Missing required address fields' });
    }

    // Validate phone: must be 10 digits (after stripping country code)
    const cleanPhone = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, error: 'Phone must be a valid 10-digit Indian mobile number' });
    }

    // Validate pincode: 6 digits, starts with 1-9
    if (!/^[1-9]\d{5}$/.test(pincode)) {
      return res.status(400).json({ success: false, error: 'Invalid pincode' });
    }

    // Upsert guest user if they don't exist yet
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name,
        email: `guest_${userId}@orchid.guest`,
        role: 'customer',
      },
    });

    // If setting as default, unset all existing defaults first
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check if this is the first address — auto-default
    const existingCount = await prisma.address.count({ where: { userId } });
    const shouldBeDefault = isDefault || existingCount === 0;

    const address = await prisma.address.create({
      data: {
        userId,
        name,
        phone: cleanPhone,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        pincode,
        country: country || 'India',
        isDefault: shouldBeDefault,
      },
    });

    res.status(201).json({ success: true, data: address });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ success: false, error: 'Failed to save address' });
  }
});

// ─── GET /api/addresses/:userId — List user's addresses ──────────────────────
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.params.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch addresses' });
  }
});

// ─── PUT /api/addresses/:id — Update address ─────────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { userId: bodyUserId, isDefault, ...fields } = req.body;

    // Validate phone: must be 10 digits (after stripping country code)
    if (fields.phone) {
      fields.phone = fields.phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
      if (!/^\d{10}$/.test(fields.phone)) {
        return res.status(400).json({ success: false, error: 'Phone must be a valid 10-digit Indian mobile number' });
      }
    }

    // Validate pincode: 6 digits, starts with 1-9
    if (fields.pincode && !/^[1-9]\d{5}$/.test(fields.pincode)) {
      return res.status(400).json({ success: false, error: 'Invalid pincode' });
    }

    const address = await prisma.$transaction(async (tx) => {
      let finalUserId = bodyUserId;

      if (isDefault) {
        if (!finalUserId) {
          const existingAddress = await tx.address.findUnique({
            where: { id: req.params.id },
            select: { userId: true },
          });
          if (existingAddress) {
            finalUserId = existingAddress.userId;
          }
        }

        if (finalUserId) {
          await tx.address.updateMany({
            where: { userId: finalUserId, isDefault: true },
            data: { isDefault: false },
          });
        }
      }

      return await tx.address.update({
        where: { id: req.params.id },
        data: { ...fields, ...(isDefault !== undefined && { isDefault }) },
      });
    });

    res.json({ success: true, data: address });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ success: false, error: 'Failed to update address' });
  }
});

// ─── DELETE /api/addresses/:id — Delete address ───────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Safety: don't delete if it's used in an active order
    const activeOrders = await prisma.order.count({
      where: {
        shippingAddressId: req.params.id,
        orderStatus: { in: ['pending', 'confirmed', 'processing', 'shipped'] },
      },
    });
    if (activeOrders > 0) {
      return res.status(409).json({ success: false, error: 'Cannot delete: address is used in an active order' });
    }
    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, error: 'Failed to delete address' });
  }
});

export default router;
