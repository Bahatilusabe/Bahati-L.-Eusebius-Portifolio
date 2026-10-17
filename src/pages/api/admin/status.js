import { PRISMA_STUB } from '../../../lib/prisma';

export default function handler(req, res) {
  res.status(200).json({ offline: !!PRISMA_STUB });
}
