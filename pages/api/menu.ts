import type { NextApiRequest, NextApiResponse } from 'next';
import { listMenu } from '../../lib/dataStore';

export default function handler(_: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ menu: listMenu() });
}
